import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { deleteFormResponse } from "@/lib/controllers/formController";

export async function DELETE(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const { formResponseId } = await context.params;
  try {
    await deleteFormResponse(formResponseId);
    return NextResponse.json({ message: "Form response deleted successfully" });
  } catch (error) {
    console.error("Error deleting form response:", error);
    return NextResponse.json({ message: "Error deleting form response" }, { status: 500 });
  }
}
