import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/utils/authUtils";

export async function GET() {
  const session = await getServerSession(authOptions);
  const isAdmin = session && checkAdminAccess(session.user?.email);
  return NextResponse.json({ isAdmin });
}
