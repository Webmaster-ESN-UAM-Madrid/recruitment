import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import connectToDatabase from "@/lib/mongodb";
import Candidate from "@/lib/models/candidate";
import Interview from "@/lib/models/interview";
import Config from "@/lib/models/config";
import "@/lib/models/committee"; // ensure Committee schema is registered for populate

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
    const totalCandidates = await Candidate.countDocuments({ recruitmentId: currentRecruitmentId, active: true });
    // Total inactive candidates in current recruitment
    const inactiveCandidates = await Candidate.countDocuments({ recruitmentId: currentRecruitmentId, active: false });

    // Interview counts:
    // - totalInterviews: past interviews up to now (date < now), must have at least one candidate
    // - pendingInterviews: scheduled/future interviews (date >= now), must have at least one candidate
    const now = new Date();
    const totalInterviews = await Interview.countDocuments({
      recruitmentId: currentRecruitmentId,
      date: { $lt: now },
      'candidates.0': { $exists: true },
    });
    const pendingInterviews = await Interview.countDocuments({
      recruitmentId: currentRecruitmentId,
      date: { $gte: now },
      'candidates.0': { $exists: true },
    });

    // Number of interviewed candidates (present at least once)
    const interviews = await Interview.find({ recruitmentId: currentRecruitmentId }).lean();
    const interviewedCandidateIds = new Set<string>();
    for (const interview of interviews) {
      const opinions: any = interview.opinions;
      if (!opinions) continue;
      // opinions is stored as a Map in schema; when lean it may be a plain object
      const entries: [string, any][] = opinions instanceof Map ? Array.from(opinions.entries()) : Object.entries(opinions);
      for (const [candidateId, opinion] of entries) {
        if (opinion?.status === "present") interviewedCandidateIds.add(candidateId as string);
      }
    }
    const interviewedCandidatesCount = interviewedCandidateIds.size;
    // Number of interviewed ACTIVE candidates (present at least once and currently active)
    const interviewedActiveCandidatesCount = await Candidate.countDocuments({
      recruitmentId: currentRecruitmentId,
      active: true,
      _id: { $in: Array.from(interviewedCandidateIds) },
    });

    // Committee interests distribution and expected event attendance
    const candidates = await Candidate.find({ recruitmentId: currentRecruitmentId, active: true })
      .populate("interests", "name color")
      .lean();

    const committeeInterests: Record<string, { count: number; color?: string }> = {};
    const eventAttendance: Record<string, { yes: number; maybe: number; no: number }> = {
      "Welcome Meeting": { yes: 0, maybe: 0, no: 0 },
      "Welcome Days": { yes: 0, maybe: 0, no: 0 },
      "Integration Weekend": { yes: 0, maybe: 0, no: 0 },
      "Plataforma Local": { yes: 0, maybe: 0, no: 0 },
    };

    for (const c of candidates as any[]) {
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
    });
  } catch (err) {
    console.error("/api/stats/recruitment error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
