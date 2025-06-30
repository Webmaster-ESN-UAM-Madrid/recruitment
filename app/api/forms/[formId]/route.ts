import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";

export async function DELETE(request: Request, context: any) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
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
