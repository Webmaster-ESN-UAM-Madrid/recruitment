import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";

export async function GET() {
  const session = await getServerSession(authOptions);
  const hasRecruitmentAccess = await checkRecruiterAccess(session?.user?.email);
  return NextResponse.json({ hasRecruitmentAccess });
}
