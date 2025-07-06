import Feedback from "../models/feedback";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getCurrentRecruitmentDetails } from "@/lib/controllers/adminController";

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

    const feedback = await Feedback.find({ givenBy: session.user.id, recruitmentId: currentRecruitmentId });
    return feedback;
};

export const createFeedback = async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    console.log("Session:", session);
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
    const updatedFeedback = await Feedback.findOneAndUpdate({ _id: params.id, givenBy: session.user.id }, { content: feedback, isEdited: true, updatedAt: new Date() }, { new: true });
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
