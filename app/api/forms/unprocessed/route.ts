
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import FormResponse from "@/lib/models/formResponse";

export async function GET() {
    await dbConnect();
    try {
        const unprocessedResponses = await FormResponse.find({ processed: false });
        return NextResponse.json(unprocessedResponses);
    } catch (error) {
        console.error("Error fetching unprocessed form responses:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
