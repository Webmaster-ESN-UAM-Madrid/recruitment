import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserNewbieSelections,
  updateUserNewbieSelections
} from "@/lib/controllers/userController";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { selections, newbie } = await getUserNewbieSelections(session.user.id);
    return NextResponse.json({ selections, isNewbie: newbie });
  } catch (error) {
    console.error("Failed to fetch newbie selections", error);
    return NextResponse.json({ message: "Failed to fetch newbie selections" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { selections } = body ?? {};

    if (!Array.isArray(selections) || !selections.every((id) => typeof id === "string")) {
      return NextResponse.json({ message: "Invalid selections payload" }, { status: 400 });
    }

    const uniqueSelections = Array.from(new Set(selections));

    await updateUserNewbieSelections(session.user.id, uniqueSelections);

    return NextResponse.json({ message: "Selections saved" });
  } catch (error) {
    console.error("Failed to update newbie selections", error);
    return NextResponse.json({ message: "Failed to update newbie selections" }, { status: 500 });
  }
}
