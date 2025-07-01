import { NextRequest, NextResponse } from "next/server";
import { getCandidateById, updateCandidate } from "@/lib/controllers/candidateController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";

export async function GET(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const { params } = context;
  const candidate = await getCandidateById(params.id);
  if (!candidate) {
    return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
  }
  return NextResponse.json(candidate);
}

export async function PUT(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const { params } = context;
  const body = await req.json();
  const updatedCandidate = await updateCandidate(params.id, body);
  if (!updatedCandidate) {
    return NextResponse.json({ message: "Failed to update candidate" }, { status: 500 });
  }
  return NextResponse.json(updatedCandidate);
}