import { NextRequest, NextResponse } from "next/server";
import { createFeedback, getFeedback } from "@/lib/controllers/feedbackController";

export async function POST(req: NextRequest) {
    const res = await createFeedback(req);
    return NextResponse.json(res);
}

export async function GET(req: NextRequest) {
    const res = await getFeedback();
    return NextResponse.json(res);
}