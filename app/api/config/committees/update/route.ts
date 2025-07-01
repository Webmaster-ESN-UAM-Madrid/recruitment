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
        const { originalName, name, color } = await req.json();

        if (!originalName || !name || !color) {
            return NextResponse.json({ message: "Original name, new name, and color are required" }, { status: 400 });
        }

        const globalConfig = await Config.findById("globalConfig");

        if (!globalConfig) {
            return NextResponse.json({ message: "Global config not found" }, { status: 404 });
        }

        const committeeIndex = globalConfig.committees.findIndex((c: any) => c.name === originalName);

        if (committeeIndex === -1) {
            return NextResponse.json({ message: "Committee not found" }, { status: 404 });
        }

        globalConfig.committees[committeeIndex] = { name, color };
        await globalConfig.save();

        return NextResponse.json({ message: "Committee updated successfully", committee: { name, color } });
    } catch (error) {
        console.error("Error updating committee:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
