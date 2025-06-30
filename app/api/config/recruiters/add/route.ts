import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Config from "@/lib/models/config";

export async function POST(request: Request) {
    await dbConnect();
    try {
        const { email } = await request.json();

        const globalConfig = await Config.findById("globalConfig");
        if (!globalConfig) {
            return NextResponse.json({ message: "Global config not found" }, { status: 404 });
        }

        // Check if email is already a recruiter
        if (globalConfig.recruiters.includes(email)) {
            return NextResponse.json({ message: "Email is already a recruiter" }, { status: 409 });
        }

        globalConfig.recruiters.push(email);
        await globalConfig.save();

        return NextResponse.json({ message: "Recruiter added successfully" });
    } catch (error) {
        console.error("Error adding recruiter:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
