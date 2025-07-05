import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { getCandidates } from "@/lib/controllers/candidateController";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const isRecruiter = await checkRecruiterAccess(session.user?.email);

    if (isRecruiter) {
        const candidates = await getCandidates();
        return NextResponse.json(candidates);
    } else {
        const candidates = await getCandidates(true);
        const limitedCandidates = candidates.map((candidate) => ({
            _id: candidate._id,
            name: candidate.name,
            photoUrl: candidate.photoUrl
        }));
        return NextResponse.json(limitedCandidates);
    }
}
