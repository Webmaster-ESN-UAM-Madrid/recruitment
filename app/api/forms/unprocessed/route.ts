import { NextResponse } from "next/server";
import { getUnprocessedFormResponses } from "@/lib/controllers/formController";

export async function GET() {
    const result = await getUnprocessedFormResponses();
    return NextResponse.json(result.data, { status: result.status });
}