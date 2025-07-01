import { NextRequest, NextResponse } from "next/server";
import { getRecruiters } from "@/lib/controllers/adminController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const recruiters = await getRecruiters();
    return NextResponse.json(recruiters);
}
