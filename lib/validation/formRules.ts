import Candidate, { ICandidate } from "@/lib/models/candidate";
import { IFormResponse } from "@/lib/models/formResponse";
import { IForm } from "@/lib/models/form";
import { IIncident } from "@/lib/models/incident";

function getEmailFromResponse(response: IFormResponse, form: IForm): string | undefined {
  const emailKey = Array.from(form.fieldMappings.entries()).find(
    ([, value]) => value === "user.email"
  )?.[0];

  if (!emailKey) {
    return undefined;
  }

  return (response.responses.get(emailKey) as unknown as string).toLowerCase() || undefined;
}

// Rule for forms that create candidates
export async function validateCandidateCreation(
  response: IFormResponse,
  form: IForm
): Promise<Partial<IIncident>[]> {
  const incidents: Partial<IIncident>[] = [];

  const formEmail = getEmailFromResponse(response, form);
  const respondentEmail = response.respondentEmail?.toLowerCase();

  const emailsToCheck = [...new Set([formEmail, respondentEmail].filter(Boolean))];

  if (emailsToCheck.length === 0) {
    incidents.push({ type: "ERROR", details: "No email found in form response or metadata." });
    return incidents;
  }

  // Find how many unique candidates are associated with the found emails
  const distinctCandidates = await Candidate.find({
    $or: [{ email: { $in: emailsToCheck } }, { alternateEmails: { $in: emailsToCheck } }]
  }).distinct("_id");

  if (distinctCandidates.length > 0) {
    incidents.push({
      type: "WARNING",
      details: `At least one of the emails ${emailsToCheck.join(", ")} is associated with an existing candidate.`
    });
  }

  return incidents;
}

// Rule for forms that do not create candidates
export async function validateAssociatedUser(
  response: IFormResponse,
  form: IForm
): Promise<{ incidents: Partial<IIncident>[]; candidate: ICandidate | null }> {
  const incidents: Partial<IIncident>[] = [];

  const formEmail = getEmailFromResponse(response, form);
  const respondentEmail = response.respondentEmail?.toLowerCase();

  const emailsToCheck = [...new Set([formEmail, respondentEmail].filter(Boolean))];

  if (emailsToCheck.length === 0) {
    incidents.push({ type: "ERROR", details: "No email found in form response or metadata." });
    return { incidents, candidate: null };
  }

  // Find how many unique candidates are associated with the found emails
  const candidates = await Candidate.find({
    $or: [{ email: { $in: emailsToCheck } }, { alternateEmails: { $in: emailsToCheck } }]
  });

  if (candidates.length > 1) {
    incidents.push({
      type: "WARNING",
      details: `The emails ${emailsToCheck.join(", ")} are associated with different candidates.`
    });
  } else if (candidates.length === 0) {
    incidents.push({
      type: "WARNING",
      details: `No candidates found for the emails ${emailsToCheck.join(", ")}.`
    });
  }

  return { incidents, candidate: candidates[0] || null };
}
