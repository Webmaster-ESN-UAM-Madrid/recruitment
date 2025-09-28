import { NextResponse } from "next/server";
import { handleFormResponse } from "@/lib/controllers/formController";

export async function POST(request: Request) {
  const { respondentEmail, responses, appsScriptId } = await request.json();
  const result = await handleFormResponse(respondentEmail, responses, appsScriptId);
  return NextResponse.json({ message: result.message }, { status: result.status });
}
