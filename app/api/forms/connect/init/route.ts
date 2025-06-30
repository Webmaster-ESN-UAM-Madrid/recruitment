import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import FormConnection from "@/lib/models/formConnection";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    await dbConnect();

    try {
        const key = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 3600 * 1000); // Expires in 1 hour

        await FormConnection.create({
            key,
            provider: "GOOGLE_FORMS",
            expiresAt
        });

        return NextResponse.json({ key });
    } catch (error) {
        console.error("Error initializing form connection:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
