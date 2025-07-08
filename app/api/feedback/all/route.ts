import { NextResponse } from "next/server";
import { getAllFeedbackWithCategories } from "@/lib/controllers/feedbackController";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const feedback = await getAllFeedbackWithCategories();
        return NextResponse.json(feedback, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch all feedback:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
