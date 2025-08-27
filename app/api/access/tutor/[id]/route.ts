import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkTutorAccess } from "@/lib/utils/authUtils";

export async function GET(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ hasAccess: false }, { status: 200 });
  }
  const params = await context.params;
  const candidateId = params.id as string;
  try {
    const allowed = await checkTutorAccess(session.user.email, candidateId);
    return NextResponse.json({ hasAccess: allowed });
  } catch (error) {
    console.error("tutor access check failed", error);
    return NextResponse.json({ hasAccess: false }, { status: 500 });
  }
}
