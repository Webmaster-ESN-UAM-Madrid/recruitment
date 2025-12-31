import { NextRequest, NextResponse } from "next/server";
import { updateFormMappings } from "@/lib/controllers/formController";

export async function PATCH(req: NextRequest, context: any) {
  const { formId } = await context.params;
  const { fieldMappings } = await req.json();

  const result = await updateFormMappings(formId, fieldMappings);

  if (result.status === 200) {
    return NextResponse.json(
      { message: result.message, form: result.data },
      { status: result.status }
    );
  } else {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }
}
