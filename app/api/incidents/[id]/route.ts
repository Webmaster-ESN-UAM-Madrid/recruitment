import { NextRequest, NextResponse } from "next/server";
import {
  getIncidentById,
  updateIncident,
  deleteIncident,
  resolveIncident
} from "@/lib/controllers/incidentController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";

export async function GET(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const { id } = context.params;
  const res = await getIncidentById(id);
  return NextResponse.json(res);
}

export async function PUT(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const { id } = context.params;
  const body = await req.json();
  const res = await updateIncident(id, body);
  return NextResponse.json(res);
}

export async function DELETE(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const { id } = context.params;
  const res = await deleteIncident(id);
  return NextResponse.json(res);
}

export async function PATCH(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !(await checkRecruiterAccess(session.user?.email))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  const { id } = context.params;
  const body = await req.json();
  const res = await resolveIncident(id);
  return NextResponse.json(res);
}
