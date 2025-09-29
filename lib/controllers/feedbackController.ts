import Feedback from "../models/feedback";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getCurrentRecruitmentDetails, getGlobalConfig } from "@/lib/controllers/adminController";
import { getCandidateById } from "@/lib/controllers/candidateController";
import { IUser } from "../models/user";

interface Context {
  params: {
    id: string;
  };
}

export const getFeedback = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return [];
  }
  await dbConnect();
  const recruitmentDetails = await getCurrentRecruitmentDetails();
  if (!recruitmentDetails.currentRecruitment) {
    console.error("Could not retrieve current recruitment details.");
    return [];
  }
  const currentRecruitmentId = recruitmentDetails.currentRecruitment;

  const feedback = await Feedback.find({
    givenBy: session.user.id,
    recruitmentId: currentRecruitmentId
  });
  return feedback;
};

export const createFeedback = async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }
  await dbConnect();
  const body = await req.json();
  const { candidateId, feedback } = body;

  const recruitmentDetails = await getCurrentRecruitmentDetails();
  if (!recruitmentDetails.currentRecruitment) {
    console.error("Could not retrieve current recruitment details.");
    return { success: false, message: "Could not determine current recruitment" };
  }
  const currentRecruitmentId = recruitmentDetails.currentRecruitment;

  const newFeedback = new Feedback({
    candidateId,
    givenBy: session.user.id,
    recruitmentId: currentRecruitmentId,
    content: feedback
  });
  await newFeedback.save();
  return newFeedback;
};

export const updateFeedback = async (req: NextRequest, context: Context) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }
  await dbConnect();
  const params = await context.params;
  const body = await req.json();
  const { feedback } = body;
  const updatedFeedback = await Feedback.findOneAndUpdate(
    { _id: params.id, givenBy: session.user.id },
    { content: feedback, isEdited: true, updatedAt: new Date() },
    { new: true }
  );
  return updatedFeedback;
};

export const deleteFeedback = async (req: NextRequest, context: Context) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }
  await dbConnect();
  const params = await context.params;
  await Feedback.findOneAndDelete({ _id: params.id, givenBy: session.user.id });
  return { success: true };
};

export const getFeedbackByCandidateId = async (candidateId: string) => {
  await dbConnect();
  const recruitmentDetails = await getCurrentRecruitmentDetails();
  if (!recruitmentDetails.currentRecruitment) {
    console.error("Could not retrieve current recruitment details.");
    return { recruiters: [], tutor: [], volunteers: [], newbies: [] };
  }
  const currentRecruitmentId = recruitmentDetails.currentRecruitment;

  const feedback = await Feedback.find({
    candidateId,
    recruitmentId: currentRecruitmentId
  }).populate("givenBy");

  const globalConfig = await getGlobalConfig();
  const recruiters = globalConfig.data?.recruiters?.map((r: IUser) => r.email) || [];

  const candidate = await getCandidateById(candidateId);
  const tutorEmail = candidate?.tutor;

  const categorizedFeedback: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recruiters: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tutor: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    volunteers: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newbies: any[];
  } = {
    recruiters: [],
    tutor: [],
    volunteers: [],
    newbies: []
  };

  for (const fb of feedback) {
    if (recruiters.includes(fb.givenBy.email)) {
      categorizedFeedback.recruiters.push(fb.toObject());
    } else if (fb.givenBy.email === tutorEmail) {
      categorizedFeedback.tutor.push(fb.toObject());
    } else if (fb.givenBy.newbie) {
      categorizedFeedback.newbies.push(fb.toObject());
    } else {
      categorizedFeedback.volunteers.push(fb.toObject());
    }
  }

  return categorizedFeedback;
};

export const getAllFeedbackWithCategories = async () => {
  await dbConnect();
  const recruitmentDetails = await getCurrentRecruitmentDetails();
  if (!recruitmentDetails.currentRecruitment) {
    console.error("Could not retrieve current recruitment details.");
    return [];
  }
  const currentRecruitmentId = recruitmentDetails.currentRecruitment;

  const feedback = await Feedback.find({ recruitmentId: currentRecruitmentId }).populate("givenBy");

  const globalConfig = await getGlobalConfig();
  const recruiters = globalConfig.data?.recruiters?.map((r: IUser) => r.email) || [];

  // Map of candidateId to tutor email
  const candidateTutorMap: Record<string, string | undefined> = {};

  // Get all unique candidateIds
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidateIds = [...new Set(feedback.map((fb: any) => fb.candidateId.toString()))];

  // Fetch tutors for all candidates
  const candidateTutorPromises = candidateIds.map(async (candidateId) => {
    const candidate = await getCandidateById(candidateId);
    candidateTutorMap[candidateId] = candidate?.tutor;
  });
  await Promise.all(candidateTutorPromises);

  // Categorize feedback per candidate
  const categorizedFeedback: Record<
    string,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recruiters: any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tutor: any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      volunteers: any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newbies: any[];
    }
  > = {};

  for (const fb of feedback) {
    const candidateId = fb.candidateId.toString();
    if (!categorizedFeedback[candidateId]) {
      categorizedFeedback[candidateId] = {
        recruiters: [],
        tutor: [],
        volunteers: [],
        newbies: []
      };
    }
    const tutorEmail = candidateTutorMap[candidateId];
    if (fb.givenBy.email === tutorEmail) {
      categorizedFeedback[candidateId].tutor.push(fb.toObject());
    } else if (recruiters.includes(fb.givenBy.email)) {
      categorizedFeedback[candidateId].recruiters.push(fb.toObject());
    } else if (fb.givenBy.newbie) {
      categorizedFeedback[candidateId].newbies.push(fb.toObject());
    } else {
      categorizedFeedback[candidateId].volunteers.push(fb.toObject());
    }
  }

  return categorizedFeedback;
};
