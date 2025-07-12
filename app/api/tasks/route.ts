import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import Candidate from "@/lib/models/candidate";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const isRecruiter = await checkRecruiterAccess(session.user?.email);

    if (isRecruiter) {
        try {
            const { candidateIds } = await req.json();
            await Candidate.updateMany(
                { _id: { $in: candidateIds } },
                { $set: { emailSent: true } }
            );
            return NextResponse.json({ message: "Candidates updated successfully" }, { status: 200 });
        } catch (error) {
            console.error("Error updating candidates:", error);
            return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
        }
    } else {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
}
