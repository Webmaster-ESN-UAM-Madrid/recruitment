import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";
import { initFormConnection } from "@/lib/controllers/formController";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !checkAdminAccess(session.user?.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const result = await initFormConnection();
  return NextResponse.json(result.data, { status: result.status });
}
