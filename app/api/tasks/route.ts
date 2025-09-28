import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import Candidate from "@/lib/models/candidate";
import { getTasksStatus } from "@/lib/controllers/candidateController";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const isRecruiter = await checkRecruiterAccess(session.user?.email);

  if (isRecruiter) {
    try {
      const { candidateIds } = await req.json();
      await Candidate.updateMany({ _id: { $in: candidateIds } }, { $set: { emailSent: true } });
      return NextResponse.json({ message: "Candidates updated successfully" }, { status: 200 });
    } catch (error) {
      console.error("Error updating candidates:", error);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
  } else {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const isRecruiter = await checkRecruiterAccess(session.user?.email);

  if (isRecruiter) {
    try {
      if (session.user?.id) {
        const tasksStatus = await getTasksStatus(session.user.id);
        return NextResponse.json(tasksStatus, { status: 200 });
      } else {
        return NextResponse.json(
          {
            personalTasks: 0,
            hasGlobalTasks: 0
          },
          { status: 200 }
        );
      }
    } catch (error) {
      console.error("Error fetching tasks status:", error);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
  } else {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
}
