import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { getInterviews } from "@/lib/controllers/interviewController";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const isRecruiter = await checkRecruiterAccess(session.user?.email);

    if (isRecruiter) {
        const interviews = await getInterviews(false, true);
        return NextResponse.json(interviews);
    } else {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
}
