import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { 
  getActivityBySlug,
  getActivityById, 
  updateActivity,
  updateActivityById, 
  deleteActivity,
  deleteActivityById 
} from "@/lib/controllers/activityController";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email?.endsWith("@esnuam.org")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let activity = await getActivityById(id);
    if (!activity) {
      activity = await getActivityBySlug(id);
    }
    
    if (!activity) {
      return NextResponse.json({ message: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error("GET activity error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const hasAccess = await checkRecruiterAccess(session?.user?.email);
    if (!hasAccess) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let updatedActivity = await updateActivityById(id, body);
    
    // Fallback to slug if ID fails
    if (!updatedActivity) {
      updatedActivity = await updateActivity(id, body);
    }
    
    if (!updatedActivity) {
      return NextResponse.json({ message: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error("PUT activity error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const hasAccess = await checkRecruiterAccess(session?.user?.email);
    if (!hasAccess) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let deleted = await deleteActivityById(id);
    
    // Fallback to slug if ID fails
    if (!deleted) {
      deleted = await deleteActivity(id);
    }

    if (!deleted) {
      return NextResponse.json({ message: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("DELETE activity error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
