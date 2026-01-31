import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import connectToDatabase from "@/lib/mongodb";
import Candidate from "@/lib/models/candidate";
import Interview from "@/lib/models/interview";
import Config from "@/lib/models/config";
import User from "@/lib/models/user";
import Activity from "@/lib/models/activity";
import "@/lib/models/committee"; // ensure Committee schema is registered for populate

const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() ?? "";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const hasAccess = await checkRecruiterAccess(session?.user?.email);
    if (!hasAccess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const config = await Config.findById("globalConfig");
    if (!config) return NextResponse.json({ error: "Configuration not found" }, { status: 404 });

    const currentRecruitmentId = config.currentRecruitment;

    // Total active candidates in current recruitment
    const totalCandidates = await Candidate.countDocuments({
      recruitmentId: currentRecruitmentId,
      active: true
    });
    // Total inactive candidates in current recruitment
    const inactiveCandidates = await Candidate.countDocuments({
      recruitmentId: currentRecruitmentId,
      active: false
    });

    // Interview counts:
    // - totalInterviews: past interviews up to now (date < now), must have at least one candidate
    // - pendingInterviews: scheduled/future interviews (date >= now), must have at least one candidate
    const now = new Date();
    const totalInterviews = await Interview.countDocuments({
      recruitmentId: currentRecruitmentId,
      date: { $lt: now },
      "candidates.0": { $exists: true }
    });
    const pendingInterviews = await Interview.countDocuments({
      recruitmentId: currentRecruitmentId,
      date: { $gte: now },
      "candidates.0": { $exists: true }
    });

    // Number of interviewed candidates (present at least once)
    const interviews = await Interview.find({ recruitmentId: currentRecruitmentId }).lean();
    const interviewedCandidateIds = new Set<string>();
    for (const interview of interviews) {
      const opinions: any = interview.opinions;
      if (!opinions) continue;
      // opinions is stored as a Map in schema; when lean it may be a plain object
      const entries: [string, any][] =
        opinions instanceof Map ? Array.from(opinions.entries()) : Object.entries(opinions);
      for (const [candidateId, opinion] of entries) {
        if (opinion?.status === "present") interviewedCandidateIds.add(candidateId as string);
      }
    }
    const interviewedCandidatesCount = interviewedCandidateIds.size;
    // Number of interviewed ACTIVE candidates (present at least once and currently active)
    const interviewedActiveCandidatesCount = await Candidate.countDocuments({
      recruitmentId: currentRecruitmentId,
      active: true,
      _id: { $in: Array.from(interviewedCandidateIds) }
    });

    // Committee interests distribution and expected event attendance
    const activeCandidates = await Candidate.find({
      recruitmentId: currentRecruitmentId,
      active: true
    })
      .populate("interests", "name color")
      .lean();

    const allCandidatesRaw = await Candidate.find({ recruitmentId: currentRecruitmentId })
      .select("_id name email alternateEmails photoUrl active")
      .lean();

    const committeeInterests: Record<string, { count: number; color?: string }> = {};
    const eventAttendance: Record<string, { yes: number; maybe: number; no: number }> = {
      "Welcome Meeting": { yes: 0, maybe: 0, no: 0 },
      "Welcome Days": { yes: 0, maybe: 0, no: 0 },
      "Integration Weekend": { yes: 0, maybe: 0, no: 0 },
      "Plataforma Local": { yes: 0, maybe: 0, no: 0 }
    };

    for (const c of activeCandidates as any[]) {
      // interests is array of populated committee docs
      (c.interests || []).forEach((i: any) => {
        const key = i?.name || "Unknown";
        if (!committeeInterests[key]) committeeInterests[key] = { count: 0, color: i?.color };
        committeeInterests[key].count += 1;
      });

      // events attendance rules (only for interviewed candidates):
      // - yes: value === true
      // - no: value === false
      // - maybe: property exists and value === null
      // - undefined or missing property: do not count
      if (c.events && interviewedCandidateIds.has(String((c as any)._id))) {
        for (const k of Object.keys(eventAttendance)) {
          if (Object.prototype.hasOwnProperty.call(c.events, k)) {
            const v = (c as any).events[k];
            if (v === true) eventAttendance[k].yes += 1;
            else if (v === false) eventAttendance[k].no += 1;
            else if (v === null) eventAttendance[k].maybe += 1;
          }
        }
      }
    }

    const defaultAvatar = "/default-avatar.jpg";
    const candidateById = new Map<
      string,
      {
        id: string;
        name: string;
        photoUrl?: string;
        active: boolean;
      }
    >();
    const candidateIdByEmail = new Map<string, string>();

    for (const rawCandidate of allCandidatesRaw as any[]) {
      const id = String(rawCandidate._id);
      const name = typeof rawCandidate.name === "string" ? rawCandidate.name : "Sin nombre";
      const active = Boolean(rawCandidate.active);
      const photoUrl =
        typeof rawCandidate.photoUrl === "string" && rawCandidate.photoUrl.trim().length > 0
          ? rawCandidate.photoUrl
          : undefined;

      const primaryEmail = normalizeEmail(rawCandidate.email);
      if (primaryEmail) {
        candidateIdByEmail.set(primaryEmail, id);
      }

      if (Array.isArray(rawCandidate.alternateEmails)) {
        for (const alt of rawCandidate.alternateEmails) {
          const normalizedAlt = normalizeEmail(alt);
          if (normalizedAlt && !candidateIdByEmail.has(normalizedAlt)) {
            candidateIdByEmail.set(normalizedAlt, id);
          }
        }
      }

      candidateById.set(id, {
        id,
        name,
        active,
        photoUrl
      });
    }

    const votersRaw = await User.find({ "newbieCandidateSelections.0": { $exists: true } })
      .select("email newbieCandidateSelections image")
      .lean();

    const votesReceived = new Map<string, number>();
    const votesGiven = new Map<string, number>();
    const hasOutgoingVotes = new Set<string>();
    const linkWeights = new Map<string, { source: string; target: string; value: number }>();

    for (const voter of votersRaw as any[]) {
      const voterEmail = normalizeEmail(voter.email);
      const voterCandidateId = candidateIdByEmail.get(voterEmail);
      if (!voterCandidateId) continue;

      const selectionsArray = Array.isArray(voter.newbieCandidateSelections)
        ? voter.newbieCandidateSelections.map((sel: unknown) => String(sel))
        : [];

      const uniqueSelections = new Set<string>();
      for (const selection of selectionsArray) {
        if (candidateById.has(selection)) {
          uniqueSelections.add(selection);
        }
      }

      if (uniqueSelections.size === 0) continue;

      const voterCandidate = candidateById.get(voterCandidateId);
      if (voterCandidate && (!voterCandidate.photoUrl || voterCandidate.photoUrl.length === 0)) {
        if (typeof voter.image === "string" && voter.image.trim().length > 0) {
          voterCandidate.photoUrl = voter.image;
        }
      }

      hasOutgoingVotes.add(voterCandidateId);
      votesGiven.set(
        voterCandidateId,
        (votesGiven.get(voterCandidateId) ?? 0) + uniqueSelections.size
      );

      for (const targetId of uniqueSelections) {
        votesReceived.set(targetId, (votesReceived.get(targetId) ?? 0) + 1);
        const key = `${voterCandidateId}->${targetId}`;
        const existing = linkWeights.get(key);
        if (existing) {
          existing.value += 1;
        } else {
          linkWeights.set(key, { source: voterCandidateId, target: targetId, value: 1 });
        }
      }
    }

    const nodeIdsToInclude = new Set<string>();
    for (const candidateEntry of candidateById.values()) {
      if (candidateEntry.active) {
        nodeIdsToInclude.add(candidateEntry.id);
      }
    }
    for (const { source, target } of linkWeights.values()) {
      nodeIdsToInclude.add(source);
      nodeIdsToInclude.add(target);
    }

    const voteGraphNodes = Array.from(nodeIdsToInclude)
      .map((id) => {
        const candidateEntry = candidateById.get(id);
        if (!candidateEntry) return null;
        return {
          id,
          name: candidateEntry.name,
          photoUrl:
            candidateEntry.photoUrl && candidateEntry.photoUrl.length > 0
              ? candidateEntry.photoUrl
              : defaultAvatar,
          active: candidateEntry.active,
          votesReceived: votesReceived.get(id) ?? 0,
          votesGiven: votesGiven.get(id) ?? 0,
          hasOutgoingVotes: hasOutgoingVotes.has(id)
        };
      })
      .filter(
        (
          node
        ): node is {
          id: string;
          name: string;
          photoUrl: string;
          active: boolean;
          votesReceived: number;
          votesGiven: number;
          hasOutgoingVotes: boolean;
        } => Boolean(node)
      );

    const voteGraphLinks = Array.from(linkWeights.values());

    return NextResponse.json({
      totalCandidates,
      totalInterviews,
      interviewedCandidatesCount,
      interviewedActiveCandidatesCount,
      committeeInterests,
      eventAttendance,
      currentRecruitmentId,
      inactiveCandidates,
      pendingInterviews,
      activities: await Activity.find({ recruitmentId: currentRecruitmentId }).sort({ date: 1 }),
      allCandidates: Array.from(candidateById.values()),
      newbieVoteGraph: {
        nodes: voteGraphNodes,
        links: voteGraphLinks
      }
    });
  } catch (err) {
    console.error("/api/stats/recruitment error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
