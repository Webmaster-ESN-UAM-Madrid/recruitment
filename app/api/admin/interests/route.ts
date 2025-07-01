import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";
import Interest, { IInterest } from "@/lib/models/interest";
import dbConnect from "@/lib/mongodb";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    await dbConnect();
    try {
        const interests = await Interest.find({});
        return NextResponse.json(interests);
    } catch (error) {
        console.error("Error fetching interests:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    await dbConnect();
    try {
        const body: IInterest = await req.json();
        const newInterest = await Interest.create(body);
        return NextResponse.json(newInterest);
    } catch (error) {
        console.error("Error creating interest:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
