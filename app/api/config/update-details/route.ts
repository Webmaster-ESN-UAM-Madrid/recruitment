import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";
import { updateRecruitmentDetails } from "@/lib/controllers/adminController";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !checkAdminAccess(session.user?.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const { currentRecruitment, recruitmentPhase } = await request.json();
  const result = await updateRecruitmentDetails(currentRecruitment, recruitmentPhase);
  return NextResponse.json({ message: result.message }, { status: result.status });
}
