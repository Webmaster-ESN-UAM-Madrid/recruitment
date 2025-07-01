import User, { IUser } from "@/lib/models/user";
import dbConnect from "@/lib/mongodb";

interface Config {
    // Add config properties as needed
    [key: string]: any;
}

interface FormLink {
    // Add form link properties as needed
    [key: string]: any;
}

export function getConfig() { 
    console.log("getConfig called");
    return { message: "Config retrieved" };
}

export function updateConfig(config: Config) { 
    console.log("updateConfig called with:", config);
    return { message: "Config updated" };
}

export function getLogs() { 
    console.log("getLogs called");
    return { message: "Logs retrieved" };
}

export function linkGoogleForm(form: FormLink) { 
    console.log("linkGoogleForm called with:", form);
    return { message: "Google Form linked" };
}

export const getRecruiters = async (): Promise<IUser[]> => {
    await dbConnect();
    try {
        const recruiters = await User.find({ roles: "recruiter" });
        return recruiters;
    } catch (error) {
        console.error("Error fetching recruiters:", error);
        return [];
    }
};