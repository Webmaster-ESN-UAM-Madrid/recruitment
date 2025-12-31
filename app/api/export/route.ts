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
import Availability from "@/lib/models/availability";
import JSZip from "jszip";
import { Types } from "mongoose";

function transformMongoData(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Date objects and date strings
  if (obj instanceof Date) {
    const date = obj instanceof Date ? obj : new Date(obj);
    return { $date: date.toISOString() };
  }

  // Handle ObjectId - both as instance and string
  if (obj instanceof Types.ObjectId) {
    return { $oid: obj.toString() };
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => transformMongoData(item));
  }

  // Handle objects
  if (typeof obj === "object") {
    const transformed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip keys starting with underscore (like _id) as they're handled separately
      if (!key.startsWith("_")) {
        transformed[key] = transformMongoData(value);
      } else if (key === "_id") {
        transformed[key] = transformMongoData(value);
      }
    }
    return transformed;
  }

  return obj;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !checkAdminAccess(session.user?.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  // Fetch all collections with proper transformation
  const interviews = await Interview.find({}).lean({ getters: true });
  const candidates = await Candidate.find({}).lean({ getters: true });
  const users = await User.find({}).lean({ getters: true });
  const committees = await Committee.find({}).lean({ getters: true });
  const configs = await Config.find({}).lean({ getters: true });
  const feedbacks = await Feedback.find({}).lean({ getters: true });
  const forms = await Form.find({}).lean({ getters: true });
  const formconnections = await FormConnection.find({}).lean({ getters: true });
  const formresponses = await FormResponse.find({}).lean({ getters: true });
  const incidents = await Incident.find({}).lean({ getters: true });
  const availabilities = await Availability.find({}).lean({ getters: true });

  // Create zip with transformed data
  const zip = new JSZip();

  // Helper function to stringify with MongoDB Extended JSON v2
  const stringifyExtendedJSON = (data: any) => {
    return JSON.stringify(transformMongoData(data), null, 2);
  };

  zip.file("interviews.json", stringifyExtendedJSON(interviews));
  zip.file("candidates.json", stringifyExtendedJSON(candidates));
  zip.file("users.json", stringifyExtendedJSON(users));
  zip.file("committees.json", stringifyExtendedJSON(committees));
  zip.file("configs.json", stringifyExtendedJSON(configs));
  zip.file("feedbacks.json", stringifyExtendedJSON(feedbacks));
  zip.file("forms.json", stringifyExtendedJSON(forms));
  zip.file("formconnections.json", stringifyExtendedJSON(formconnections));
  zip.file("formresponses.json", stringifyExtendedJSON(formresponses));
  zip.file("incidents.json", stringifyExtendedJSON(incidents));
  zip.file("availabilities.json", stringifyExtendedJSON(availabilities));

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=db_export.zip"
    }
  });
}
