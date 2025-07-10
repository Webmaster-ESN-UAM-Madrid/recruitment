import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { getInterviews, createInterview } from "@/lib/controllers/interviewController";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const isRecruiter = await checkRecruiterAccess(session.user?.email);

    if (isRecruiter) {
        const interviews = await getInterviews();
        return NextResponse.json(interviews);
    } else {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const isRecruiter = await checkRecruiterAccess(session.user?.email);

    if (isRecruiter) {
        try {
            const body = await req.json();
            const newInterviewData = {
                ...body,
                candidates: body.candidates.map((id: string) => new Types.ObjectId(id)),
                interviewers: body.interviewers.map((id: string) => new Types.ObjectId(id)),
                // opinions field is already in the correct format from the frontend
            };
            const newInterview = await createInterview(newInterviewData);
            return NextResponse.json(newInterview, { status: 201 });
        } catch (error) {
            console.error("Error creating interview:", error);
            return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
        }
    } else {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
}
