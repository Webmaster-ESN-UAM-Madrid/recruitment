import connectToDatabase from "../mongodb";
import Config, { IConfig } from "../models/config";

export async function getRecruiterEmailsFromDB(): Promise<string[]> {
    try {
        await connectToDatabase();
        const globalConfig: IConfig | null = await Config.findById('globalConfig').populate('recruiters', 'email');
        if (globalConfig && globalConfig.recruiters) {
            // Ensure recruiters is an array of objects with an email property
            return globalConfig.recruiters;
        }
        return [];
    } catch (error) {
        console.error("Error fetching recruiter emails from DB:", error);
        return [];
    }
}
