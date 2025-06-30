import connectToDatabase from "../mongodb";
import Config, { IConfig } from "../models/config";
import { IUser } from "../models/user";

export async function getRecruiterEmailsFromDB(): Promise<string[]> {
    try {
        await connectToDatabase();
        const globalConfig: IConfig | null = await Config.findById('globalConfig').populate('recruiters', 'email');
        if (globalConfig && globalConfig.recruiters) {
            // Ensure recruiters is an array of objects with an email property
            return globalConfig.recruiters.map((recruiter: any) => recruiter.email);
        }
        return [];
    } catch (error) {
        console.error("Error fetching recruiter emails from DB:", error);
        return [];
    }
}
