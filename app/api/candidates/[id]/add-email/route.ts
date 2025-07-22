import { NextRequest, NextResponse } from "next/server";
import { addAlternateEmail } from "@/lib/controllers/candidateController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";

export async function POST(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session || !(await checkRecruiterAccess(session.user?.email))) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { email } = body;

    if (!id || !email) {
        return NextResponse.json({ message: "id and email are required" }, { status: 400 });
    }

    try {
        const result = await addAlternateEmail(id, email);
        if (result) {
            return NextResponse.json({ message: "Email added successfully" }, { status: 200 });
        } else {
            return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
        }
    } catch (error) {
        console.error("Error adding alternate email:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
