import { NextRequest, NextResponse } from "next/server";
import { updateFeedback, deleteFeedback } from "@/lib/controllers/feedbackController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const { params } = context as { params: { id: string } };
    const body = await req.json();
    const res = await updateFeedback({ ...body, id: params.id });
    return NextResponse.json(res);
}

export async function DELETE(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const { params } = context as { params: { id: string } };
    const res = await deleteFeedback(params.id);
    return NextResponse.json(res);
}
