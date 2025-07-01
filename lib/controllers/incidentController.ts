import Incident, { IIncident } from "@/lib/models/incident";
import dbConnect from "@/lib/mongodb";

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
        const incidents = await Incident.find({});
        return incidents;
    } catch (error) {
        console.error("Error fetching incidents:", error);
        return [];
    }
};
