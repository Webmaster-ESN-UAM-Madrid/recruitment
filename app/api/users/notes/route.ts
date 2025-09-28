import { NextRequest, NextResponse } from "next/server";
import { getUserNotes, updateUserNote } from "@/lib/controllers/userController";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const notes = await getUserNotes(session.user.id);
    return NextResponse.json(Object.fromEntries(notes));
  } catch (error) {
    console.error("Failed to fetch user notes:", error);
    return NextResponse.json({ message: "Failed to fetch user notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { candidateId, note } = await req.json();
    await updateUserNote(session.user.id, candidateId, note);
    return NextResponse.json({ message: "Note updated successfully" });
  } catch (error) {
    console.error("Failed to update note:", error);
    return NextResponse.json({ message: "Failed to update note" }, { status: 500 });
  }
}
