import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterEmailsFromDB } from '@/lib/utils/authUtils';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Define admin emails (hardcoded, same as in middleware)
const adminEmails = ["vicepresident@esnuam.org", "hector.tablero@esnuam.org", "mario.viton@esnuam.org"];

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Check for admin access first
    if (adminEmails.includes(userEmail)) {
        return NextResponse.json({ message: 'Welcome Admin! You have full access to candidate data.' });
    }

    // Fetch recruiter emails dynamically
    const recruiterEmails = await getRecruiterEmailsFromDB();

    // Check for recruiter access
    if (recruiterEmails.includes(userEmail)) {
        return NextResponse.json({ message: 'Welcome Recruiter! You have access to candidate data.' });
    }

    // If neither admin nor recruiter
    return NextResponse.json({ message: 'Access Denied. You are not authorized to view candidate data.' }, { status: 403 });
}
