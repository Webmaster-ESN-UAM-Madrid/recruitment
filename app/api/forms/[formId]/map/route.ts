import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/form";

export async function POST(request: Request, context: any) {
    const { params } = context as { params: { formId: string } };
    await dbConnect();

    try {
        const { formId } = params;
        const { fieldMappings } = await request.json();

        const form = await Form.findById(formId);

        if (!form) {
            return NextResponse.json({ message: "Form not found" }, { status: 404 });
        }

        form.fieldMappings = fieldMappings;
        await form.save();

        return NextResponse.json({ message: "Field mappings saved" });
    } catch (error) {
        console.error("Error saving field mappings:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}