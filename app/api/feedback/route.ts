import { NextRequest, NextResponse } from 'next/server';
import { createFeedback, getFeedback } from '@/lib/controllers/feedbackController';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await createFeedback(body);
  return NextResponse.json(res);
}

export async function GET(req: NextRequest) {
  console.log("GET request received for feedback:", req.url);
  const res = await getFeedback();
  return NextResponse.json(res);
}