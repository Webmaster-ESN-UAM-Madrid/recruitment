import { NextRequest, NextResponse } from "next/server";
import {
  createIncident,
  getIncidents,
  getIncidentsStatus
} from "@/lib/controllers/incidentController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const body = await req.json();
  const res = await createIncident(body);
  return NextResponse.json(res);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  if (status === "true") {
    const res = await getIncidentsStatus();
    return NextResponse.json(res);
  }

  const res = await getIncidents();
  return NextResponse.json(res);
}
