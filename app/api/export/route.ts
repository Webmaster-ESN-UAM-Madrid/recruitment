import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";
import dbConnect from "@/lib/mongodb";
import Interview from "@/lib/models/interview";
import Candidate from "@/lib/models/candidate";
import User from "@/lib/models/user";
import Committee from "@/lib/models/committee";
import Config from "@/lib/models/config";
import Feedback from "@/lib/models/feedback";
import Form from "@/lib/models/form";
import FormConnection from "@/lib/models/formConnection";
import FormResponse from "@/lib/models/formResponse";
import Incident from "@/lib/models/incident";
import JSZip from "jszip";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !checkAdminAccess(session.user?.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  // Fetch all collections
  const interviews = await Interview.find({});
  const candidates = await Candidate.find({});
  const users = await User.find({});
  const committees = await Committee.find({});
  const configs = await Config.find({});
  const feedbacks = await Feedback.find({});
  const forms = await Form.find({});
  const formconnections = await FormConnection.find({});
  const formresponses = await FormResponse.find({});
  const incidents = await Incident.find({});

  // Create zip
  const zip = new JSZip();
  zip.file("interviews.json", JSON.stringify(interviews, null, 2));
  zip.file("candidates.json", JSON.stringify(candidates, null, 2));
  zip.file("users.json", JSON.stringify(users, null, 2));
  zip.file("committees.json", JSON.stringify(committees, null, 2));
  zip.file("configs.json", JSON.stringify(configs, null, 2));
  zip.file("feedbacks.json", JSON.stringify(feedbacks, null, 2));
  zip.file("forms.json", JSON.stringify(forms, null, 2));
  zip.file("formconnections.json", JSON.stringify(formconnections, null, 2));
  zip.file("formresponses.json", JSON.stringify(formresponses, null, 2));
  zip.file("incidents.json", JSON.stringify(incidents, null, 2));

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=db_export.zip",
    },
  });
}
