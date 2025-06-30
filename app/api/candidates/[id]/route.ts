import { NextRequest, NextResponse } from "next/server";
import { getCandidateById, updateCandidate, deleteCandidate } from "@/lib/controllers/candidateController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";

export async function GET(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session || !(await checkRecruiterAccess(session.user?.email))) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const { params } = context as { params: { id: string } };
    const res = await getCandidateById(params.id);
    return NextResponse.json(res);
}

export async function PUT(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session || !(await checkRecruiterAccess(session.user?.email))) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const { params } = context as { params: { id: string } };
    const body = await req.json();
    const res = await updateCandidate({ ...body, id: params.id });
    return NextResponse.json(res);
}

export async function DELETE(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session || !(await checkRecruiterAccess(session.user?.email))) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const { params } = context as { params: { id: string } };
    const res = await deleteCandidate(params.id);
    return NextResponse.json(res);
}