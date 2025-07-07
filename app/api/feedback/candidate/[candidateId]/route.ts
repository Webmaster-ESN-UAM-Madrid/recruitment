import { NextRequest, NextResponse } from "next/server";
import { getFeedbackByCandidateId } from "@/lib/controllers/feedbackController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";

export async function GET(req: NextRequest, context: any) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(await checkRecruiterAccess(session.user?.email))) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }
        const { candidateId } = await context.params;
        const feedback = await getFeedbackByCandidateId(candidateId);
        return NextResponse.json(feedback);
    } catch (error) {
        console.error("Error fetching feedback by candidate ID:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
