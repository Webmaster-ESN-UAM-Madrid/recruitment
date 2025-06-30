import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !(await checkRecruiterAccess(session.user?.email))) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    await dbConnect();
    try {
        const forms = await Form.find({});
        return NextResponse.json(forms);
    } catch (error) {
        console.error("Error fetching forms:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
