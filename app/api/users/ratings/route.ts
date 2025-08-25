import { NextRequest, NextResponse } from "next/server";
import { getUserRatings, updateUserRating } from "@/lib/controllers/userController";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    try {
        const { candidateId, rating } = await req.json();
        // rating can be 1-5 or null
        await updateUserRating(session.user.id, candidateId, rating);
        return NextResponse.json({ message: "Rating updated successfully" });
    } catch (error) {
        console.error("Failed to update rating:", error);
        return NextResponse.json({ message: "Failed to update rating" }, { status: 500 });
    }
}
