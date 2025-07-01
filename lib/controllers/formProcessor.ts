import Form, { IForm } from "@/lib/models/form";
import FormResponse, { IFormResponse } from "@/lib/models/formResponse";
import Incident, { IIncident } from "@/lib/models/incident";
import Candidate from "@/lib/models/candidate";
import { validateCandidateCreation, validateAssociatedUser } from "@/lib/validation/formRules";
import { createIncident } from "@/lib/controllers/incidentController";

function getMappingFromResponse(response: IFormResponse, form: IForm, field: string): string | undefined {
    const key = Array.from(form.fieldMappings.entries()).find(([, value]) => value === field)?.[0];

    if (!key) {
        return undefined;
    }

    return response.responses.get(key) as string | undefined;
}

export async function processFormResponse(formResponseId: string) {
    try {
        const response = await FormResponse.findById(formResponseId);
        if (!response) {
            await createIncident({
                type: "ERROR",
                details: `FormResponse with ID ${formResponseId} not found.`,
            });
            throw new Error("FormResponse not found");
        }

        const form = await Form.findById(response.formId);
        if (!form) {
            await createIncident({
                type: "ERROR",
                details: `Form with ID ${response.formId} not found for FormResponse ${formResponseId}.`,
            });
            throw new Error("Form not found");
        }

    let incidents: Partial<IIncident>[] = [];

    if (form.canCreateUsers) {
        incidents = await validateCandidateCreation(response, form);
    } else {
        incidents = await validateAssociatedUser(response, form);
    }

    if (incidents.length > 0) {
        for (const incident of incidents) {
            await Incident.create({
                ...incident,
                form: form._id,
                formResponse: response._id
            });
        }
        console.log(`Processing stopped for response ${response._id} due to validation issues.`);
        return { status: "failed", incidents };
    }

    if (form.canCreateUsers) {
        const name = getMappingFromResponse(response, form, "user.name");
        const formEmail = getMappingFromResponse(response, form, "user.email");
        const respondentEmail = response.respondentEmail;
        const allEmails = [...new Set([formEmail, respondentEmail].filter(Boolean))];

        if (name && allEmails.length > 0) {
            const existingCandidate = await Candidate.findOne({
                $or: [{ email: { $in: allEmails } }, { alternateEmails: { $in: allEmails } }]
            });

            let candidateInstance;
            if (existingCandidate) {
                // Update existing candidate
                const newEmails = allEmails.filter((e) => e !== existingCandidate.email && !existingCandidate.alternateEmails.includes(e));
                if (newEmails.length > 0) {
                    existingCandidate.alternateEmails.push(...newEmails);
                    await existingCandidate.save();
                    console.log(`Updated candidate ${existingCandidate._id} with new emails.`);
                }
                candidateInstance = existingCandidate;
            } else {
                // Create new candidate
                const primaryEmail = formEmail || respondentEmail;
                const alternateEmails = allEmails.filter((e) => e !== primaryEmail);
                candidateInstance = await Candidate.create({
                    recruitmentId: form.recruitmentProcessId,
                    name,
                    email: primaryEmail,
                    alternateEmails
                });
                console.log(`Successfully created candidate from response ${response._id}`);
            }
            response.candidateId = candidateInstance._id;
        }
    }

    response.processed = true;
    await response.save();

    return { status: "success", incidents };
    } catch (error: unknown) {
        console.error(`Error processing form response ${formResponseId}:`, error);
        await createIncident({
            type: "ERROR",
            details: `Failed to process form response ${formResponseId}: ` + (error instanceof Error ? error.message : String(error)),
        });
        return { status: "failed", incidents: [] };
    }
}
