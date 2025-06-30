import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/form";
import FormResponse from "@/lib/models/formResponse";

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

        await FormResponse.create({
            formId: form._id,
            respondentEmail,
            responses,
            processed: false // Default to false as per requirement
        });

        return NextResponse.json({ message: "Form response received successfully" });
    } catch (error) {
        console.error("Error processing form response:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
