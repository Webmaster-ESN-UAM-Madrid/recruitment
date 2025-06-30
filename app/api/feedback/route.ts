import { NextRequest, NextResponse } from "next/server";
import { createFeedback, getFeedback } from "@/lib/controllers/feedbackController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const res = await createFeedback(body);
    return NextResponse.json(res);
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    console.log("GET request received for feedback:", req.url);
    const res = await getFeedback();
    return NextResponse.json(res);
}
