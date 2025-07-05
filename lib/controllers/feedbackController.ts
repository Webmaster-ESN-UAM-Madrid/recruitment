import Feedback from "../models/feedback";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

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
    const feedback = await Feedback.find({ givenBy: session.user.id });
    return feedback;
};

export const createFeedback = async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    console.log("Session:", session);
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }
    const body = await req.json();
    const { candidateId, feedback } = body;
    const newFeedback = new Feedback({
        candidateId,
        givenBy: session.user.id,
        recruitmentId: "2025",
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
    let { params } = context;
    const body = await req.json();
    params = await params;
    const { feedback } = body;
    const updatedFeedback = await Feedback.findOneAndUpdate({ _id: params.id, givenBy: session.user.id }, { content: feedback, isEdited: true, updatedAt: new Date() }, { new: true });
    return updatedFeedback;
};

export const deleteFeedback = async (req: NextRequest, context: Context) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }
    const { params } = context;
    await Feedback.findOneAndDelete({ _id: params.id, givenBy: session.user.id });
    return { success: true };
};
