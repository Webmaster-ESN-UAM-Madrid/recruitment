import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { getGlobalConfig } from "@/lib/controllers/adminController";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !checkRecruiterAccess(session.user?.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const result = await getGlobalConfig();
  return NextResponse.json(result.data, { status: result.status });
}
