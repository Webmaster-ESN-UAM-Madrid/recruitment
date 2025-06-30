import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/form";
import FormResponse from "@/lib/models/formResponse";
import { processGoogleFormsResponse } from "@/lib/controllers/formResponseController";
import { Document } from 'mongoose';

interface FormDocument extends Document {
    _id: string; // Explicitly define _id as string
    provider: 'GOOGLE_FORMS';
    fieldMappings: Record<string, string>;
    canCreateUsers: boolean;
}

const responseHandlers = {
    GOOGLE_FORMS: processGoogleFormsResponse
    // Add other providers here
};

export async function POST(request: Request, context: any) {
    const { params } = context as { params: { formId: string } };
    await dbConnect();

    try {
        const { formId } = params;
        const responseData = await request.json();

        const form: FormDocument | null = await Form.findById(formId);

        if (!form) {
            return NextResponse.json({ message: "Form not heaven" }, { status: 404 });
        }

        await FormResponse.create({
            form: formId,
            response: JSON.stringify(responseData)
        });

        const handler = responseHandlers[form.provider];
        if (handler) {
            await handler(form, responseData);
        }

        return NextResponse.json({ message: "Response received" });
    } catch (error) {
        console.error("Error receiving form response:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
