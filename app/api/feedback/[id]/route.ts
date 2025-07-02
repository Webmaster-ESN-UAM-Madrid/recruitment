import { NextRequest, NextResponse } from "next/server";
import { updateFeedback, deleteFeedback } from "@/lib/controllers/feedbackController";

export async function PUT(req: NextRequest, context: any) {
    const res = await updateFeedback(req, context);
    return NextResponse.json(res);
}

export async function DELETE(req: NextRequest, context: any) {
    const res = await deleteFeedback(req, context);
    return NextResponse.json(res);
}