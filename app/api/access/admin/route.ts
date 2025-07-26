import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/utils/authUtils";

// Hardcoded admin emails
const adminEmails = ["vicepresident@esnuam.org", "hector.tablero@esnuam.org", "mario.viton@esnuam.org"];

export async function GET() {
    const session = await getServerSession(authOptions);
    const isAdmin = session && checkAdminAccess(session.user?.email);
    return NextResponse.json({ isAdmin });
}
