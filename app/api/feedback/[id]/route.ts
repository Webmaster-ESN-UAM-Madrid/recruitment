import { NextRequest, NextResponse } from 'next/server';
import { updateFeedback, deleteFeedback } from '@/lib/controllers/feedbackController';

export async function PUT(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  const body = await req.json();
  const res = await updateFeedback({ ...body, id: params.id });
  return NextResponse.json(res);
}

export async function DELETE(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  const res = await deleteFeedback(params.id);
  return NextResponse.json(res);
}