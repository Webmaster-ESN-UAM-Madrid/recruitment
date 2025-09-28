import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { getForms } from "@/lib/controllers/formController";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const result = await getForms();
  return NextResponse.json(result.data, { status: result.status });
}
