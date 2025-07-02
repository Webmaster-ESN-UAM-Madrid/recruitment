import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Form from "@/lib/models/form";

export async function PATCH(req: NextRequest, context: any) {
    await connectDB();
    const { formId } = context.params;

    try {
        const { fieldMappings } = await req.json();

        if (!fieldMappings || typeof fieldMappings !== "object") {
            return NextResponse.json({ message: "Invalid fieldMappings provided" }, { status: 400 });
        }

        const updatedForm = await Form.findByIdAndUpdate(formId, { $set: { fieldMappings: fieldMappings } }, { new: true, runValidators: true });

        if (!updatedForm) {
            return NextResponse.json({ message: "Form not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Form mappings updated successfully", form: updatedForm });
    } catch (error: any) {
        console.error("Error updating form mappings:", error);
        return NextResponse.json({ message: "Error updating form mappings", error: error.message }, { status: 500 });
    }
}
