import connectToDatabase from "../mongodb";
import Config, { IConfig } from "../models/config";
import { getCandidateById } from "@/lib/controllers/candidateController";

// Hardcoded admin emails
const adminEmails = [
  "vicepresident@esnuam.org",
  "hector.tablero@esnuam.org",
  "mario.viton@esnuam.org"
];

export async function getRecruiterEmailsFromDB(): Promise<string[]> {
  try {
    await connectToDatabase();
    const globalConfig: IConfig | null = await Config.findById("globalConfig").populate(
      "recruiters",
      "email"
    );
    if (globalConfig && globalConfig.recruiters) {
      return globalConfig.recruiters;
    }
    return [];
  } catch (error) {
    console.error("Error fetching recruiter emails from DB:", error);
    return [];
  }
}

export function checkAdminAccess(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  return adminEmails.includes(email);
}

export async function checkRecruiterAccess(email: string | null | undefined): Promise<boolean> {
  if (!email) {
    return false;
  }

  // Check if the user is an admin
  if (adminEmails.includes(email)) {
    return true;
  }

  // Check if the user is a recruiter from the database
  const recruiterEmails = await getRecruiterEmailsFromDB();
  return recruiterEmails.includes(email);
}

// Check if a session user has tutor access to a candidate
// Accepts either the tutor field from candidate (string email) and the session user id/email pair
export async function checkTutorAccess(
  userEmail: string | null | undefined,
  candidateId: string
): Promise<boolean> {
  if (!userEmail) return false;
  try {
    const candidate = await getCandidateById(candidateId);
    if (!candidate) return false;
    const tutor = candidate.tutor as string | undefined | null;
    if (!tutor) return false;
    return tutor === userEmail || tutor === String(userEmail);
  } catch (error) {
    console.error("hasTutorAccess error", error);
    return false;
  }
}

