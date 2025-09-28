import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRecruiterAccess } from "@/lib/utils/authUtils";
import { getInterviews, createInterview } from "@/lib/controllers/interviewController";
import { updateCandidate } from "@/lib/controllers/candidateController";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const isRecruiter = await checkRecruiterAccess(session.user?.email);

  if (isRecruiter) {
    const interviews = await getInterviews();
    return NextResponse.json(interviews);
  } else {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const isRecruiter = await checkRecruiterAccess(session.user?.email);

  if (isRecruiter) {
    try {
      const { interviewData, events } = await req.json();
      const newInterviewData = {
        ...interviewData,
        candidates: interviewData.candidates.map((id: string) => new Types.ObjectId(id)),
        interviewers: interviewData.interviewers.map((id: string) => new Types.ObjectId(id))
      };
      const newInterview = await createInterview(newInterviewData);

      for (const candidateId in events) {
        await updateCandidate(candidateId, { events: events[candidateId] });
      }

      return NextResponse.json(newInterview, { status: 201 });
    } catch (error) {
      console.error("Error creating interview:", error);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
  } else {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
}
