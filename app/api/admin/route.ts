import { NextRequest, NextResponse } from "next/server";
import { getConfig, updateConfig, linkGoogleForm } from "@/lib/controllers/adminController";

export async function GET() {
    const res = await getConfig();
    return NextResponse.json(res);
}

export async function PUT(req: NextRequest) {
    const body = await req.json();
    const res = await updateConfig(body);
    return NextResponse.json(res);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const res = await linkGoogleForm(body);
    return NextResponse.json(res);
}
