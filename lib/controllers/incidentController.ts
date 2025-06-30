interface Incident {
    id: string;
    description: string;
    // Add other properties as needed
}

export const getIncidentById = async (id: string) => {
    console.log(`getIncidentById called with id: ${id}`);
    return { id, description: "Placeholder Incident" };
};

export const updateIncident = async (incident: Incident) => {
    console.log("updateIncident called with:", incident);
    return { success: true, updatedId: incident.id };
};

export const deleteIncident = async (id: string) => {
    console.log(`deleteIncident called with id: ${id}`);
    return { success: true, deletedId: id };
};

export const resolveIncident = async (id: string) => {
    console.log(`resolveIncident called with id: ${id}`);
    return { success: true, resolvedId: id };
};

export const createIncident = async (incident: Incident) => {
    console.log("createIncident called with:", incident);
    return { success: true, createdId: "new-incident-id" };
};

export const getIncidents = async () => {
    console.log("getIncidents called");
    return [{ id: "1", description: "Incident 1" }, { id: "2", description: "Incident 2" }];
};
