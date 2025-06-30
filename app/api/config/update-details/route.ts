import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Config from "@/lib/models/config";

export async function POST(request: Request) {
    await dbConnect();
    try {
        const { currentRecruitment, recruitmentPhase } = await request.json();

        const globalConfig = await Config.findById('globalConfig');
        if (!globalConfig) {
            return NextResponse.json({ message: "Global config not found" }, { status: 404 });
        }

        globalConfig.currentRecruitment = currentRecruitment;
        globalConfig.recruitmentPhase = recruitmentPhase;
        await globalConfig.save();

        return NextResponse.json({ message: "Config updated successfully" });
    } catch (error) {
        console.error("Error updating config details:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
