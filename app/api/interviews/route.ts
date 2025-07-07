import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { getInterviews, createInterview } from "@/lib/controllers/interviewController";

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
            const newInterview = await createInterview(body);
            return NextResponse.json(newInterview, { status: 201 });
        } catch (error) {
            console.error("Error creating interview:", error);
            return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
        }
    } else {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
}
