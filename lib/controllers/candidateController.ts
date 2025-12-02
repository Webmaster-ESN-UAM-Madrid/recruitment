import Candidate, { ICandidate } from "@/lib/models/candidate";
import dbConnect from "@/lib/mongodb";
import { getCurrentRecruitmentDetails } from "@/lib/controllers/adminController";
import Interview from "@/lib/models/interview";

export const checkForRedFlag = async (emails: string[]) => {
  const rejectedCandidates = await Candidate.find({
    $or: [{ email: { $in: emails } }, { alternateEmails: { $in: emails } }],
    active: false
  }).sort({ appliedAt: -1 });

  if (rejectedCandidates.length > 0) {
    const comments = rejectedCandidates.map((c) => {
      const reasonPart = c.rejectedReason ? `: ${c.rejectedReason}` : "";
      return `${c.recruitmentId}${reasonPart}`;
    });

    return {
      tag: "redFlag",
      comment: comments.join("\n")
    };
  }
  return null;
};

export const getCandidateById = async (id: string): Promise<ICandidate | null> => {
  await dbConnect();
  try {
    const candidate = await Candidate.findById(id);
    return candidate;
  } catch (error) {
    console.error(`Error fetching candidate by ID ${id}:`, error);
    return null;
  }
};

export const updateCandidate = async (
  id: string,
  updates: Partial<ICandidate>
): Promise<ICandidate | null> => {
  await dbConnect();
  try {
    const candidate = await Candidate.findByIdAndUpdate(id, updates, { new: true });
    return candidate;
  } catch (error) {
    console.error(`Error updating candidate ${id}:`, error);
    return null;
  }
};

export const deleteCandidate = async (id: string): Promise<boolean> => {
  await dbConnect();
  try {
    const result = await Candidate.deleteOne({ _id: id });
    return result.deletedCount === 1;
  } catch (error) {
    console.error(`Error deleting candidate ${id}:`, error);
    return false;
  }
};

export const createCandidate = async (
  candidateData: Partial<ICandidate>
): Promise<ICandidate | null> => {
  await dbConnect();
  try {
    const recruitmentDetails = await getCurrentRecruitmentDetails();
    if (!recruitmentDetails.currentRecruitment) {
      console.error("Could not retrieve current recruitment details.");
      return null;
    }
    const currentRecruitmentId = recruitmentDetails.currentRecruitment;
    const currentRecruitmentPhase = recruitmentDetails.recruitmentPhase;

    const allEmails = [candidateData.email, ...(candidateData.alternateEmails || [])].filter(
      (e): e is string => !!e
    );
    const redFlagTag = await checkForRedFlag(allEmails);
    const tags = candidateData.tags || [];
    if (redFlagTag) {
      tags.push(redFlagTag);
    }

    const candidate = await Candidate.create({
      ...candidateData,
      tags,
      recruitmentId: currentRecruitmentId,
      recruitmentPhase: currentRecruitmentPhase
    });
    return candidate;
  } catch (error) {
    console.error("Error creating candidate:", error);
    return null;
  }
};

export const getCandidates = async (active: boolean = false): Promise<ICandidate[]> => {
  await dbConnect();
  try {
    const recruitmentDetails = await getCurrentRecruitmentDetails();
    if (!recruitmentDetails.currentRecruitment) {
      console.error("Could not retrieve current recruitment details.");
      return [];
    }
    const currentRecruitmentId = recruitmentDetails.currentRecruitment;
    const currentRecruitmentPhase = recruitmentDetails.recruitmentPhase;

    await Candidate.updateMany(
      {
        recruitmentId: currentRecruitmentId,
        recruitmentPhase: { $exists: false }
      },
      {
        $set: {
          recruitmentPhase: currentRecruitmentPhase,
          emailSent: true
        }
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { recruitmentId: currentRecruitmentId };
    if (active) {
      query.active = true;
    }
    const candidates = await Candidate.find(query);
    return candidates;
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return [];
  }
};

export const addAlternateEmail = async (id: string, email: string): Promise<ICandidate | null> => {
  await dbConnect();
  try {
    const candidate = await Candidate.findById(id);
    if (candidate) {
      candidate.alternateEmails.push(email);
      await candidate.save();
    }
    return candidate;
  } catch (error) {
    console.error(`Error adding alternate email to candidate ${id}:`, error);
    return null;
  }
};

const nonFeedbackStatuses = ["cancelled", "absent"];

export const getTasksStatus = async (userId: string) => {
  await dbConnect();
  try {
    const recruitmentDetails = await getCurrentRecruitmentDetails();
    const currentRecruitmentId = recruitmentDetails.currentRecruitment;

    const now = new Date();
    // Single query to get all interviews
    const allInterviews = await Interview.find({
      opinions: { $exists: true }
    }).populate("candidates");

    // Filter for pending feedback (personal tasks)
    const pendingFeedback = allInterviews.filter((interview) => {
      const isInterviewer = interview.interviewers.includes(userId);
      const isPastInterview = new Date(interview.date) <= now;

      if (!isInterviewer || !isPastInterview) return false;

      for (const candidate of interview.candidates) {
        // Check if candidate belongs to current recruitment
        if (candidate.recruitmentId !== currentRecruitmentId) continue;

        const candidateId = candidate._id.toString();
        if (
          !interview.opinions.get(candidateId)?.interviewers.get(userId)?.opinion &&
          !nonFeedbackStatuses.includes(interview.opinions.get(candidateId)?.status)
        ) {
          return true;
        }
      }
      return false;
    });

    const candidates = await getCandidates();
    const pendingEmails = candidates.some((c) => !c.emailSent);

    // Check for unnotified interviews from the same allInterviews array
    const unnotifiedInterviews = allInterviews.some((interview) =>
      interview.candidates.some(
        (candidate: ICandidate) =>
          candidate.recruitmentId === currentRecruitmentId &&
          !interview.opinions.get(candidate._id.toString())?.interviewNotified
      )
    );

    return {
      personalTasks: pendingFeedback.length,
      hasGlobalTasks: pendingEmails || unnotifiedInterviews
    };
  } catch (error) {
    console.error("Error fetching tasks status:", error);
    return {
      personalTasks: 0,
      hasGlobalTasks: false
    };
  }
};
