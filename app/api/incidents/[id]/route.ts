import { NextRequest, NextResponse } from 'next/server';
import { getIncidentById, updateIncident, deleteIncident, resolveIncident } from '@/lib/controllers/incidentController';

export async function GET(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  const res = await getIncidentById(params.id);
  return NextResponse.json(res);
}

export async function PUT(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  const body = await req.json();
  const res = await updateIncident({ ...body, id: params.id });
  return NextResponse.json(res);
}

export async function DELETE(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  const res = await deleteIncident(params.id);
  return NextResponse.json(res);
}

export async function PATCH(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  const body = await req.json();
  const res = await resolveIncident({ ...body, id: params.id });
  return NextResponse.json(res);
}