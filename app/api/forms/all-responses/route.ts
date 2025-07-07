import { NextRequest, NextResponse } from "next/server";
import { getAllFormResponses } from "@/lib/controllers/formController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";

export async function GET(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session || !(await checkRecruiterAccess(session.user?.email))) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const formResponses = await getAllFormResponses();
    if (!formResponses) {
        return NextResponse.json({ message: "Form responses not found" }, { status: 404 });
    }
    return NextResponse.json(formResponses);
}
