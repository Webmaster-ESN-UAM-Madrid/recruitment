import dbConnect from "@/lib/mongodb";
import Form, { IForm } from "@/lib/models/form";
import FormResponse, { IFormResponse } from "@/lib/models/formResponse";
import FormConnection from "@/lib/models/formConnection";
import Candidate, { ICandidate } from "@/lib/models/candidate";
import Config from "@/lib/models/config";
import Incident, { IIncident } from "@/lib/models/incident";
import { randomBytes } from "crypto";
import { validateCandidateCreation, validateAssociatedUser } from "@/lib/validation/formRules";
import { createIncident } from "@/lib/controllers/incidentController";
import { getCurrentRecruitmentDetails } from "@/lib/controllers/adminController";

interface FormResponseItem {
    id: string;
    value: unknown;
}

function getMappingFromResponse(response: IFormResponse, form: IForm, field: string): string | undefined {
    const key = Array.from(form.fieldMappings.entries()).find(([, value]) => value === field)?.[0];

    if (!key) {
        return undefined;
    }

    return response.responses.get(key) as string | undefined;
}

export const processFormResponse = async (formResponseId: string) => {
    try {
        await dbConnect();
        const response = await FormResponse.findById(formResponseId);
        if (!response) {
            await createIncident({
                type: "ERROR",
                details: `FormResponse with ID ${formResponseId} not found.`
            });
            throw new Error("FormResponse not found");
        }

        const form = await Form.findById(response.formId);
        if (!form) {
            await createIncident({
                type: "ERROR",
                details: `Form with ID ${response.formId} not found for FormResponse ${formResponseId}.`
            });
            throw new Error("Form not found");
        }

        let incidents: Partial<IIncident>[] = [];
        let candidate: ICandidate | null = null;

        if (form.canCreateUsers) {
            incidents = await validateCandidateCreation(response, form);
        } else {
            ({ incidents, candidate } = await validateAssociatedUser(response, form));
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
            const formEmail = getMappingFromResponse(response, form, "user.email")?.toLowerCase();
            const respondentEmail = response.respondentEmail.toLowerCase();
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
        } else {
            response.candidateId = candidate?._id;
        }

        response.processed = true;
        await response.save();

        return { status: "success", incidents };
    } catch (error: unknown) {
        console.error(`Error processing form response ${formResponseId}:`, error);
        await createIncident({
            type: "ERROR",
            details: `Failed to process form response ${formResponseId}: ` + (error instanceof Error ? error.message : String(error))
        });
        return { status: "failed", incidents: [] };
    }
};

export const getFormResponsesByCandidateId = async (candidateId: string): Promise<IFormResponse[]> => {
    await dbConnect();
    try {
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            console.error(`Candidate with ID ${candidateId} not found.`);
            return [];
        }
        const formResponses = await FormResponse.find({ candidateId: candidateId }).populate("formId");
        return formResponses;
    } catch (error) {
        console.error(`Error fetching form responses for candidate ${candidateId}:`, error);
        return [];
    }
};

export const getAllFormResponses = async (): Promise<IFormResponse[]> => {
    await dbConnect();
    try {
        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return [];
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;

        const formsInCurrentRecruitment = await Form.find({ recruitmentProcessId: currentRecruitmentId }).select("_id");
        const formIds = formsInCurrentRecruitment.map((form) => form._id);

        const formResponses = await FormResponse.find({
            formId: { $in: formIds },
            candidateId: { $exists: true, $ne: null }
        });
        return formResponses;
    } catch (error) {
        console.error("Error fetching all form responses for current recruitment:", error);
        return [];
    }
};

export const getForms = async () => {
    await dbConnect();
    try {
        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return { status: 500, message: "Could not determine current recruitment" };
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;

        const forms = await Form.find({ recruitmentProcessId: currentRecruitmentId });
        return { status: 200, data: forms };
    } catch (error) {
        console.error("Error fetching forms:", error);
        return { status: 500, message: "Internal server error" };
    }
};

export const getFormById = async (formId: string) => {
    await dbConnect();
    try {
        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return { status: 500, message: "Could not determine current recruitment" };
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;

        const form = await Form.findOne({ _id: formId, recruitmentProcessId: currentRecruitmentId });
        if (!form) {
            return { status: 404, message: "Form not found or does not belong to current recruitment process" };
        }
        return { status: 200, data: form };
    } catch (error) {
        console.error("Error fetching form:", error);
        return { status: 500, message: "Internal server error" };
    }
};

export const deleteForm = async (formId: string) => {
    await dbConnect();
    try {
        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return { status: 500, message: "Could not determine current recruitment" };
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;

        const deletedForm = await Form.findOneAndDelete({ _id: formId, recruitmentProcessId: currentRecruitmentId });
        if (!deletedForm) {
            return { status: 404, message: "Form not found or does not belong to current recruitment process" };
        }
        return { status: 200, message: "Form deleted successfully" };
    } catch (error) {
        console.error("Error deleting form:", error);
        return { status: 500, message: "Internal server error" };
    }
};

export const updateFormMappings = async (formId: string, fieldMappings: object) => {
    await dbConnect();
    try {
        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return { status: 500, message: "Could not determine current recruitment" };
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;

        if (!fieldMappings || typeof fieldMappings !== "object") {
            return { status: 400, message: "Invalid fieldMappings provided" };
        }

        const updatedForm = await Form.findOneAndUpdate({ _id: formId, recruitmentProcessId: currentRecruitmentId }, { $set: { fieldMappings: fieldMappings } }, { new: true, runValidators: true });

        if (!updatedForm) {
            return { status: 404, message: "Form not found or does not belong to current recruitment process" };
        }

        return { status: 200, message: "Form mappings updated successfully", data: updatedForm };
    } catch (error) {
        console.error("Error updating form mappings:", error);
        return { status: 500, message: "Error updating form mappings" };
    }
};

export const initFormConnection = async () => {
    await dbConnect();
    try {
        const key = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 3600 * 1000); // Expires in 1 hour

        await FormConnection.create({
            key,
            provider: "GOOGLE_FORMS",
            expiresAt
        });

        return { status: 200, data: { key } };
    } catch (error) {
        console.error("Error initializing form connection:", error);
        return { status: 500, message: "Internal server error" };
    }
};

export const registerFormConnection = async (key: string, formData: object, code: string, appsScriptId: string, canCreateUsers: boolean, formIdentifier?: string) => {
    await dbConnect();
    try {
        const connection = await FormConnection.findOne({ key });

        if (!connection || connection.expiresAt < new Date()) {
            return { status: 404, message: "Invalid or expired key" };
        }

        connection.formData = JSON.stringify(formData);
        connection.validationCode = code;
        connection.appsScriptId = appsScriptId;
        connection.canCreateUsers = canCreateUsers;
        connection.formIdentifier = formIdentifier;
        await connection.save();

        return { status: 200, message: "Registration successful" };
    } catch (error) {
        console.error("Error registering form:", error);
        return { status: 500, message: "Internal server error" };
    }
};

export const handleFormResponse = async (respondentEmail: string, responses: FormResponseItem[], appsScriptId: string) => {
    await dbConnect();
    try {
        if (!appsScriptId) {
            return { status: 400, message: "appScriptId is required" };
        }

        const form = await Form.findOne({ appsScriptId });

        if (!form) {
            console.error(`Form not found for appsScriptId: ${appsScriptId}`);
            return { status: 404, message: "Form not found" };
        }

        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return { status: 500, message: "Could not determine current recruitment" };
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;

        if (form.recruitmentProcessId !== currentRecruitmentId) {
            return { status: 403, message: "Form does not belong to the current recruitment process" };
        }

        // Convert the incoming array of responses to a Map
        const responsesMap = new Map<string, unknown>();
        if (Array.isArray(responses)) {
            for (const response of responses) {
                if (response.id !== undefined && response.value !== undefined) {
                    responsesMap.set(response.id.toString(), response.value);
                }
            }
        }

        const newFormResponse = await FormResponse.create({
            formId: form._id,
            respondentEmail,
            responses: responsesMap,
            processed: false // Default to false as per requirement
        });

        // Attempt to process the form response instantly
        try {
            console.log(`Attempting instant processing for form response ${newFormResponse._id}`);
            await processFormResponse(newFormResponse._id);
        } catch (processingError) {
            console.error(`Error during instant processing of form response ${newFormResponse._id}:`, processingError);
            // The main request should still succeed even if instant processing fails
        }

        return { status: 200, message: "Form response received successfully" };
    } catch (error) {
        console.error("Error processing form response:", error);
        return { status: 500, message: "Internal server error" };
    }
};

export const validateFormConnection = async (key: string, code: string, formIdentifier?: string, canCreateUsers?: boolean) => {
    await dbConnect();
    try {
        const connection = await FormConnection.findOne({ key });

        if (!connection || connection.expiresAt < new Date()) {
            return { status: 404, message: "Invalid or expired key" };
        }

        if (connection.validationCode !== code) {
            return { status: 400, message: "Invalid code" };
        }

        const globalConfig = await Config.findById("globalConfig");
        if (!globalConfig || !globalConfig.currentRecruitment) {
            return { status: 500, message: "Recruitment process not configured" };
        }
        const recruitmentProcessId = globalConfig.currentRecruitment;

        let form;
        if (formIdentifier) {
            form = await Form.findOneAndUpdate(
                { formIdentifier, recruitmentProcessId }, // Add recruitmentProcessId to query
                {
                    provider: connection.provider,
                    structure: connection.formData,
                    appsScriptId: connection.appsScriptId,
                    canCreateUsers: canCreateUsers,
                    recruitmentProcessId: recruitmentProcessId
                },
                { new: true, upsert: true } // Create if not found
            );
        } else {
            form = await Form.create({
                provider: connection.provider,
                structure: connection.formData,
                appsScriptId: connection.appsScriptId,
                canCreateUsers: canCreateUsers,
                recruitmentProcessId: recruitmentProcessId,
                formIdentifier: formIdentifier || undefined // Store if provided, otherwise undefined
            });
        }

        await FormConnection.deleteOne({ key });

        return { status: 200, message: "Validation successful", data: { formId: form._id } };
    } catch (error) {
        console.error("Error validating form:", error);
        return { status: 500, message: "Internal server error" };
    }
};

export const getUnprocessedFormResponses = async () => {
    await dbConnect();
    try {
        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return { status: 500, message: "Could not determine current recruitment" };
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;

        const unprocessedResponses = await FormResponse.find({
            processed: false,
            submittedAt: { $gte: new Date("2025-07-15T00:00:00.000Z") }
        }).populate({
            path: "formId",
            match: { recruitmentProcessId: currentRecruitmentId }
        });

        // Filter out responses where formId is null (meaning it didn't match the current recruitmentProcessId)
        const filteredResponses = unprocessedResponses.filter((response) => response.formId !== null);

        return { status: 200, data: filteredResponses };
    } catch (error) {
        console.error("Error fetching unprocessed form responses:", error);
        return { status: 500, message: "Internal server error" };
    }
};

export const processSingleFormResponse = async (responseId: string) => {
    try {
        if (!responseId) {
            return { status: 400, message: "responseId is required" };
        }

        const result = await processFormResponse(responseId);

        if (result.status === "failed") {
            return { status: 422, message: "Processing failed", incidents: result.incidents as IIncident[] };
        }

        return { status: 200, message: "Form response processed successfully" };
    } catch (error) {
        console.error("Error processing form response:", error);
        return { status: 500, message: "Internal server error" };
    }
};

export const deleteFormResponse = async (responseId: string) => {
    await dbConnect();
    try {
        const deletedResponse = await FormResponse.findByIdAndDelete(responseId);
        if (!deletedResponse) {
            return { status: 404, message: "FormResponse not found" };
        }
        return { status: 200, message: "Form response deleted successfully" };
    } catch (error) {
        console.error(`Error deleting form response ${responseId}:`, error);
        return { status: 500, message: "Internal server error" };
    }
};

export const attachResponseToCandidate = async (responseId: string, candidateId: string) => {
    await dbConnect();
    try {
        const response = await FormResponse.findById(responseId);
        if (!response) {
            return { status: 404, message: "FormResponse not found" };
        }

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return { status: 404, message: "Candidate not found" };
        }

        response.candidateId = candidate._id;
        response.processed = true;
        await response.save();

        const respondentEmail = response.respondentEmail.toLowerCase();
        const isNewEmail = respondentEmail !== candidate.email.toLowerCase() && !candidate.alternateEmails.map((e: string) => e.toLowerCase()).includes(respondentEmail);

        return {
            status: 200,
            data: {
                needsEmailConfirmation: isNewEmail,
                respondentEmail: respondentEmail
            }
        };
    } catch (error) {
        console.error(`Error attaching response ${responseId} to candidate ${candidateId}:`, error);
        return { status: 500, message: "Internal server error" };
    }
};
