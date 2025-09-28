import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { getFormById, deleteForm } from "@/lib/controllers/formController";

export async function GET(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const { formId } = await context.params;
  const result = await getFormById(formId);
  return NextResponse.json(result.data, { status: result.status });
}

export async function DELETE(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const { formId } = await context.params;
  const result = await deleteForm(formId);
  return NextResponse.json({ message: result.message }, { status: result.status });
}
