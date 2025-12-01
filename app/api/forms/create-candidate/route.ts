import { NextRequest, NextResponse } from "next/server";
import { forceCreateCandidateFromResponse } from "@/lib/controllers/formController";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { responseId } = body;

    if (!responseId) {
      return NextResponse.json({ message: "responseId is required" }, { status: 400 });
    }

    const result = await forceCreateCandidateFromResponse(responseId);

    if (result.status === 200) {
      return NextResponse.json(result.data, { status: 200 });
    } else {
      return NextResponse.json({ message: result.message }, { status: result.status });
    }
  } catch (error) {
    console.error("Error in create-candidate API:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
