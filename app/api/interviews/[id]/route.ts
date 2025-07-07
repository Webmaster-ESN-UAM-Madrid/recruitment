import { NextRequest, NextResponse } from "next/server";
import { getInterviewById, updateInterview } from "@/lib/controllers/interviewController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";

export async function GET(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session || !(await checkRecruiterAccess(session.user?.email))) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const params = await context.params;
    const interview = await getInterviewById(params.id);
    if (!interview) {
        return NextResponse.json({ message: "Interview not found" }, { status: 404 });
    }
    return NextResponse.json(interview);
}

export async function PUT(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session || !(await checkRecruiterAccess(session.user?.email))) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const params = await context.params;
    const body = await req.json();
    const updatedInterview = await updateInterview(params.id, body);
    if (!updatedInterview) {
        return NextResponse.json({ message: "Failed to update interview" }, { status: 500 });
    }
    return NextResponse.json(updatedInterview);
}
