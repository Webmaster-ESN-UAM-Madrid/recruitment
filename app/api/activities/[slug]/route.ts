import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import {
  getActivityBySlug,
  updateActivity,
  deleteActivity
} from "@/lib/controllers/activityController";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> } // In Next.js 15, params is a promise
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email?.endsWith("@esnuam.org")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { slug } = await params;
    const activity = await getActivityBySlug(slug);
    if (!activity) {
      return NextResponse.json({ message: "Activity not found" }, { status: 404 });
    }
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const isRecruiter = await checkRecruiterAccess(session?.user?.email);

  if (!isRecruiter) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { slug } = await params;
    const data = await req.json();
    const activity = await updateActivity(slug, data);
    if (!activity) {
      return NextResponse.json({ message: "Activity not found" }, { status: 404 });
    }
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const isRecruiter = await checkRecruiterAccess(session?.user?.email);

  if (!isRecruiter) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { slug } = await params;
    const success = await deleteActivity(slug);
    if (!success) {
      return NextResponse.json({ message: "Activity not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Activity deleted" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
