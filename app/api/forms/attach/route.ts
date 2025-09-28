import { NextRequest, NextResponse } from "next/server";
import { attachResponseToCandidate } from "@/lib/controllers/formController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { responseId, candidateId } = body;

  if (!responseId || !candidateId) {
    return NextResponse.json(
      { message: "responseId and candidateId are required" },
      { status: 400 }
    );
  }

  try {
    const result = await attachResponseToCandidate(responseId, candidateId);
    if (result.status === 200) {
      return NextResponse.json(result.data, { status: 200 });
    } else {
      return NextResponse.json({ message: result.message }, { status: result.status });
    }
  } catch (error) {
    console.error("Error attaching response to candidate:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
