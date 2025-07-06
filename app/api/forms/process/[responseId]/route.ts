import { NextResponse } from "next/server";
import { processSingleFormResponse } from "@/lib/controllers/formController";

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

        const result = await processSingleFormResponse(responseId);

        if (result.status === 422) {
            return NextResponse.json({ message: result.message, incidents: result.incidents }, { status: result.status });
        }

        return NextResponse.json({ message: result.message }, { status: result.status });
    } catch (error) {
        console.error("Error processing form response:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
