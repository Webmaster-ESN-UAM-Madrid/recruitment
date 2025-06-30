import { NextRequest, NextResponse } from "next/server";
import { createIncident, getIncidents } from "@/lib/controllers/incidentController";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const res = await createIncident(body);
    return NextResponse.json(res);
}

export async function GET() {
    const res = await getIncidents();
    return NextResponse.json(res);
}