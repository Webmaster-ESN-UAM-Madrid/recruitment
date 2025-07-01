import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/form";
import FormResponse from "@/lib/models/formResponse";
import { processFormResponse } from "@/lib/controllers/formProcessor";

export async function POST(request: Request) {
    await dbConnect();
    try {
        const { respondentEmail, responses, appsScriptId } = await request.json();

        if (!appsScriptId) {
            return NextResponse.json({ message: "appScriptId is required" }, { status: 400 });
        }

        const form = await Form.findOne({ appsScriptId });

        if (!form) {
            console.error(`Form not found for appsScriptId: ${appsScriptId}`);
            return NextResponse.json({ message: "Form not found" }, { status: 404 });
        }

        // Convert the incoming array of responses to a Map
        const responsesMap = new Map<string, any>();
        if (Array.isArray(responses)) {
            for (const response of responses) {
                if (response.id !== undefined && response.value !== undefined) {
                    responsesMap.set(response.id.toString(), response.value);
                }
            }
        }

        const newFormResponse = await FormResponse.create({
            formId: form._id,
            respondentEmail,
            responses: responsesMap,
            processed: false // Default to false as per requirement
        });

        // Attempt to process the form response instantly
        try {
            await processFormResponse(newFormResponse._id);
            console.log(`Attempted instant processing for form response ${newFormResponse._id}`);
        } catch (processingError) {
            console.error(`Error during instant processing of form response ${newFormResponse._id}:`, processingError);
            // The main request should still succeed even if instant processing fails
        }

        return NextResponse.json({ message: "Form response received successfully" });
    } catch (error) {
        console.error("Error processing form response:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}