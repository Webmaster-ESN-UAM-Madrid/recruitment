import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  const hasAccess = session && (await checkRecruiterAccess(session.user?.email));
  return NextResponse.json({ hasAccess });
}
