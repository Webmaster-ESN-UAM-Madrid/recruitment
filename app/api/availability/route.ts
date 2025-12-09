import { NextResponse } from "next/server";
import {
  getAvailabilities,
  updateUserAvailability
} from "@/lib/controllers/availabilityController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { getUserByEmail } from "@/lib/controllers/userController";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await checkRecruiterAccess(session.user.email);
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const availabilities = await getAvailabilities();
    return NextResponse.json(availabilities);
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching availabilities", error },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await checkRecruiterAccess(session.user.email);
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { slots, type } = await req.json();
    
    const user = await getUserByEmail(session.user.email);
    
    if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updatedAvailability = await updateUserAvailability(user._id, slots, type);
    
    if (updatedAvailability) {
      return NextResponse.json(updatedAvailability);
    } else {
      return NextResponse.json(
        { message: "Error updating availability" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: "Error updating availability", error },
      { status: 500 }
    );
  }
}
