import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { getFormResponses } from "@/lib/controllers/formController";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !(await checkRecruiterAccess(session.user?.email))) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const result = await getFormResponses();
    return NextResponse.json(result.data, { status: result.status });
}
