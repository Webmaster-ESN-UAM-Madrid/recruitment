import { NextRequest, NextResponse } from "next/server";
import { getInterviewById, updateInterview, deleteInterview } from "@/lib/controllers/interviewController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { Types } from "mongoose";

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
    const updatedInterviewData = {
        ...body,
        candidates: body.candidates.map((id: string) => new Types.ObjectId(id)),
        interviewers: body.interviewers.map((id: string) => new Types.ObjectId(id)),
        // opinions field is already in the correct format from the frontend
    };
    const updatedInterview = await updateInterview(params.id, updatedInterviewData);
    if (!updatedInterview) {
        return NextResponse.json({ message: "Failed to update interview" }, { status: 500 });
    }
    return NextResponse.json(updatedInterview);
}

export async function DELETE(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session || !(await checkRecruiterAccess(session.user?.email))) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const params = await context.params;
    const success = await deleteInterview(params.id);
    if (!success) {
        return NextResponse.json({ message: "Failed to delete interview" }, { status: 500 });
    }
    return NextResponse.json({ message: "Interview deleted successfully" });
}