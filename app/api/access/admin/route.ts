import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { NextResponse } from "next/server";

// Hardcoded admin emails
const adminEmails = ["vicepresident@esnuam.org", "hector.tablero@esnuam.org", "mario.viton@esnuam.org"];

export async function GET() {
    const session = await getServerSession(authOptions);
    const isAdmin = session && session.user?.email && adminEmails.includes(session.user.email);
    return NextResponse.json({ isAdmin });
}
