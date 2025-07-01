import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { getCandidates } from "@/lib/controllers/candidateController";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !(await checkRecruiterAccess(session.user?.email))) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const candidates = await getCandidates();
    return NextResponse.json(candidates);
}