import { NextRequest, NextResponse } from "next/server";
import { getInterviewsByCandidate } from "@/lib/controllers/interviewController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";

export async function GET(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const params = await context.params;
  const interviews = await getInterviewsByCandidate(params.id);
  return NextResponse.json(interviews);
}
