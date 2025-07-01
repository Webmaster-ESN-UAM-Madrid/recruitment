import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Config from "@/lib/models/config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    try {
        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ message: "Committee name is required" }, { status: 400 });
        }

        const globalConfig = await Config.findById("globalConfig");

        if (!globalConfig) {
            return NextResponse.json({ message: "Global config not found" }, { status: 404 });
        }

        const initialLength = globalConfig.committees.length;
        globalConfig.committees = globalConfig.committees.filter((c: any) => c.name !== name);

        if (globalConfig.committees.length === initialLength) {
            return NextResponse.json({ message: "Committee not found" }, { status: 404 });
        }

        await globalConfig.save();

        return NextResponse.json({ message: "Committee removed successfully" });
    } catch (error) {
        console.error("Error removing committee:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
