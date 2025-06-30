import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import FormConnection from "@/lib/models/formConnection";
import { randomBytes } from "crypto";

export async function POST() {
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
