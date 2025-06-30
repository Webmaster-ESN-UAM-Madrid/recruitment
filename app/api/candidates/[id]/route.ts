import { NextRequest, NextResponse } from "next/server";
import { getCandidateById, updateCandidate, deleteCandidate } from "@/lib/controllers/candidateController";

export async function GET(req: NextRequest, context: any) {
    const { params } = context as { params: { id: string } };
    const res = await getCandidateById(params.id);
    return NextResponse.json(res);
}

export async function PUT(req: NextRequest, context: any) {
    const { params } = context as { params: { id: string } };
    const body = await req.json();
    const res = await updateCandidate({ ...body, id: params.id });
    return NextResponse.json(res);
}

export async function DELETE(req: NextRequest, context: any) {
    const { params } = context as { params: { id: string } };
    const res = await deleteCandidate(params.id);
    return NextResponse.json(res);
}
