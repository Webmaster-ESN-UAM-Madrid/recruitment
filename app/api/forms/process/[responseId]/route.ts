import { NextResponse } from "next/server";
import { processFormResponse } from "@/lib/controllers/formProcessor";

export async function POST(request: Request, context: any) {
    try {
        let params = context.params;
        if (params && typeof params.then === 'function') { // Check if it's a Promise
            params = await params;
        }
        const { responseId } = params;
        if (!responseId) {
            return NextResponse.json({ message: "responseId is required" }, { status: 400 });
        }

        const result = await processFormResponse(responseId);

        if (result.status === 'failed') {
            return NextResponse.json({ message: "Processing failed", incidents: result.incidents }, { status: 422 });
        }

        return NextResponse.json({ message: "Form response processed successfully" });
    } catch (error) {
        console.error("Error processing form response:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}