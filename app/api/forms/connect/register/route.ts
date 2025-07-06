import { NextResponse } from "next/server";
import { registerFormConnection } from "@/lib/controllers/formController";

export async function POST(request: Request) {
    const { key, formData, code, appsScriptId, canCreateUsers, formIdentifier } = await request.json();
    const result = await registerFormConnection(key, formData, code, appsScriptId, canCreateUsers, formIdentifier);
    return NextResponse.json({ message: result.message }, { status: result.status });
}