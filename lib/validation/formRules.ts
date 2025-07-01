import Candidate from "@/lib/models/candidate";
import User from "@/lib/models/user";
import { IFormResponse } from "@/lib/models/formResponse";
import { IForm } from "@/lib/models/form";
import { IIncident } from "@/lib/models/incident";

function getEmailFromResponse(response: IFormResponse, form: IForm): string | undefined {
    const emailKey = Array.from(form.fieldMappings.entries()).find(([, value]) => value === "user.email")?.[0];

    if (!emailKey) {
        return undefined;
    }

    console.log(emailKey);

    return response.responses.get(emailKey) as string | undefined;
}

// Rule for forms that create candidates
export async function validateCandidateCreation(response: IFormResponse, form: IForm): Promise<Partial<IIncident>[]> {
    const incidents: Partial<IIncident>[] = [];

    const formEmail = getEmailFromResponse(response, form);
    const respondentEmail = response.respondentEmail;

    const emailsToCheck = [...new Set([formEmail, respondentEmail].filter(Boolean))];

    if (emailsToCheck.length === 0) {
        incidents.push({ type: "ERROR", details: "No email found in form response or metadata." });
        return incidents;
    }

    // Find how many unique candidates are associated with the found emails
    const distinctCandidates = await Candidate.find({
        $or: [{ email: { $in: emailsToCheck } }, { alternateEmails: { $in: emailsToCheck } }]
    }).distinct("_id");

    if (distinctCandidates.length > 1) {
        incidents.push({
            type: "WARNING",
            details: `The emails ${emailsToCheck.join(", ")} are associated with different candidates.`
        });
    }

    return incidents;
}

// Rule for forms that do not create candidates
export async function validateAssociatedUser(response: IFormResponse, form: IForm): Promise<Partial<IIncident>[]> {
    const incidents: Partial<IIncident>[] = [];
    const email = getEmailFromResponse(response, form);

    if (!email) {
        incidents.push({ type: "WARNING", details: "Email is missing from the form response." });
        return incidents;
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
        incidents.push({
            type: "WARNING",
            details: `No user found for email ${email}.`
        });
    }

    return incidents;
}
