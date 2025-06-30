import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/form";

export async function DELETE(request: Request, context: any) {
    await dbConnect();
    try {
        const { formId } = context.params;

        const deletedForm = await Form.findByIdAndDelete(formId);

        if (!deletedForm) {
            return NextResponse.json({ message: "Form not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Form deleted successfully" });
    } catch (error) {
        console.error("Error deleting form:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
