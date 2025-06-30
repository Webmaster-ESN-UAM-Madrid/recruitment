import { NextRequest, NextResponse } from "next/server";
import { getConfig, updateConfig, linkGoogleForm } from "@/lib/controllers/adminController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const res = await getConfig();
    return NextResponse.json(res);
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const res = await updateConfig(body);
    return NextResponse.json(res);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const res = await linkGoogleForm(body);
    return NextResponse.json(res);
}
