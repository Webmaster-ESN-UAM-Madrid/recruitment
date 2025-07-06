import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";
import { validateFormConnection } from "@/lib/controllers/formController";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const { key, code, formIdentifier, canCreateUsers } = await request.json();
    const result = await validateFormConnection(key, code, formIdentifier, canCreateUsers);
    return NextResponse.json({ message: result.message, formId: result.data?.formId }, { status: result.status });
}