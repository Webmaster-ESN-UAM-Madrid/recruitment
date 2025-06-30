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

        const initialRecruitersCount = globalConfig.recruiters.length;
        globalConfig.recruiters = globalConfig.recruiters.filter((recruiterEmail: string) => recruiterEmail !== email);

        if (globalConfig.recruiters.length === initialRecruitersCount) {
            return NextResponse.json({ message: "Email is not a recruiter" }, { status: 404 });
        }

        await globalConfig.save();

        return NextResponse.json({ message: "Recruiter removed successfully" });
    } catch (error) {
        console.error("Error removing recruiter:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
