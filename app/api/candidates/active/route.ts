import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCandidates } from "@/lib/controllers/candidateController";
import { getCurrentRecruitmentDetails } from "@/lib/controllers/adminController";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const recruitmentDetails = await getCurrentRecruitmentDetails();

  const candidates = await getCandidates(true);
  const limitedCandidates = candidates.map((candidate) => ({
    _id: candidate._id,
    name: candidate.name,
    photoUrl: candidate.photoUrl,
    tutor: candidate.tutor
  }));
  return NextResponse.json({
    candidates: limitedCandidates,
    currentPhase: recruitmentDetails.recruitmentPhase
  });
}
