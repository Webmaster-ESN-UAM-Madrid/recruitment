import Incident, { IIncident } from "@/lib/models/incident";
import dbConnect from "@/lib/mongodb";
import { getCurrentRecruitmentDetails } from "@/lib/controllers/adminController";
import FormResponse from "@/lib/models/formResponse";

export const getIncidentById = async (id: string): Promise<IIncident | null> => {
    await dbConnect();
    try {
        const incident = await Incident.findById(id);
        return incident;
    } catch (error) {
        console.error(`Error fetching incident by ID ${id}:`, error);
        return null;
    }
};

export const updateIncident = async (id: string, updates: Partial<IIncident>): Promise<IIncident | null> => {
    await dbConnect();
    try {
        const incident = await Incident.findByIdAndUpdate(id, updates, { new: true });
        return incident;
    } catch (error) {
        console.error(`Error updating incident ${id}:`, error);
        return null;
    }
};

export const deleteIncident = async (id: string): Promise<boolean> => {
    await dbConnect();
    try {
        const result = await Incident.deleteOne({ _id: id });
        return result.deletedCount === 1;
    } catch (error) {
        console.error(`Error deleting incident ${id}:`, error);
        return false;
    }
};

export const resolveIncident = async (id: string): Promise<IIncident | null> => {
    await dbConnect();
    try {
        const incident = await Incident.findByIdAndUpdate(id, { status: "RESOLVED", resolvedAt: new Date() }, { new: true });
        return incident;
    } catch (error) {
        console.error(`Error resolving incident ${id}:`, error);
        return null;
    }
};

export const createIncident = async (incidentData: Partial<IIncident>): Promise<IIncident | null> => {
    await dbConnect();
    try {
        const incident = await Incident.create(incidentData);
        return incident;
    } catch (error) {
        console.error("Error creating incident:", error);
        return null;
    }
};

export const getIncidents = async (): Promise<IIncident[]> => {
    await dbConnect();
    try {
        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return [];
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;

        const incidents = await Incident.find({ createdAt: { $gte: new Date("2025-07-15") } })
            .populate({
                path: "form",
                match: { recruitmentProcessId: currentRecruitmentId }
            })
            .populate({
                path: "formResponse",
                populate: {
                    path: "formId",
                    match: { recruitmentProcessId: currentRecruitmentId }
                }
            });

        // Filter out incidents where neither form nor formResponse's formId matches the current recruitmentProcessId
        const filteredIncidents = incidents.filter((incident) => (incident.form && incident.form.recruitmentProcessId === currentRecruitmentId) || (incident.formResponse && incident.formResponse.formId && incident.formResponse.formId.recruitmentProcessId === currentRecruitmentId));

        return filteredIncidents;
    } catch (error) {
        console.error("Error fetching incidents:", error);
        return [];
    }
};

export const getIncidentsStatus = async () => {
    await dbConnect();
    try {
        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return { warnings: 0, errors: 0 };
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;

        // Find all formResponses with processed=false and formId matching current recruitment
        const formResponses = await FormResponse.find({
            processed: false,
            submittedAt: { $gte: new Date("2025-07-15") }
        }).populate({
            path: "formId",
            match: { recruitmentProcessId: currentRecruitmentId }
        });

        let warnings = 0;
        let errors = 0;

        for (const response of formResponses) {
            if (response.formId) {
                if (response.formId.canCreateUsers) {
                    errors++;
                } else {
                    warnings++;
                }
            }
        }

        return { warnings, errors };
    } catch (error) {
        console.error("Error fetching incidents status:", error);
        return { warnings: 0, errors: 0 };
    }
};
