import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { getActivities, createActivity } from "@/lib/controllers/activityController";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email?.endsWith("@esnuam.org")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const activities = await getActivities();
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const isRecruiter = await checkRecruiterAccess(session?.user?.email);

  if (!isRecruiter) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const activity = await createActivity(data);
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
