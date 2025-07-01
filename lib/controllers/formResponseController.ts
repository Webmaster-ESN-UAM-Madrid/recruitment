import FormResponse, { IFormResponse } from "@/lib/models/formResponse";
import Candidate from "@/lib/models/candidate";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/user";
import Incident from "@/lib/models/incident";
import { solveIncident } from "@/lib/incidentSolver";

interface FormType {
    _id: string;
    provider: string;
    fieldMappings: Record<string, string>;
    canCreateUsers: boolean;
}

interface ResponseData {
    responses: Array<{ id: number; value: string }>;
}

export const getFormResponsesByCandidateId = async (candidateId: string): Promise<IFormResponse[]> => {
    await dbConnect();
    try {
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            console.error(`Candidate with ID ${candidateId} not found.`);
            return [];
        }
        // Assuming form responses are linked by respondent email
        const formResponses = await FormResponse.find({ candidateId: candidateId });
        return formResponses;
    } catch (error) {
        console.error(`Error fetching form responses for candidate ${candidateId}:`, error);
        return [];
    }
};

export const processGoogleFormsResponse = async (form: FormType, responseData: ResponseData) => {
    const emailField = Object.keys(form.fieldMappings).find((key) => form.fieldMappings[key] === "user.email");

    if (!emailField) {
        // No email field mapped, cannot process user
        return;
    }

    const email = responseData.responses.find((r) => r.id === parseInt(emailField))?.value;

    if (!email) {
        // No email in response
        return;
    }

    const user = await User.findOne({ email });

    if (user) {
        // Update existing user
        // TODO: Implement user update logic
    } else if (form.canCreateUsers) {
        // Create new user
        // TODO: Implement user creation logic
    } else {
        // Create incident
        const incident = await Incident.create({
            type: "UNKNOWN_USER",
            details: `Unknown user with email ${email} submitted a response to form ${form._id}`,
            status: "OPEN"
        });
        await solveIncident(incident._id);
    }
};
