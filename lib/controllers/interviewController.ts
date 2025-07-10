import Interview, { IInterview } from "@/lib/models/interview";
import dbConnect from "@/lib/mongodb";
import { getCurrentRecruitmentDetails } from "@/lib/controllers/adminController";

export const getInterviewById = async (id: string): Promise<IInterview | null> => {
    await dbConnect();
    try {
        const interview = await Interview.findById(id);
        return interview;
    } catch (error) {
        console.error(`Error fetching interview by ID ${id}:`, error);
        return null;
    }
};

export const getInterviewsByCandidate = async (candidateId: string): Promise<IInterview[]> => {
    await dbConnect();
    try {
        const interviews = await Interview.find({ candidates: candidateId });
        return interviews;
    } catch (error) {
        console.error(`Error fetching interviews for candidate ${candidateId}:`, error);
        return [];
    }

}

export const updateInterview = async (id: string, updates: Partial<IInterview>): Promise<IInterview | null> => {
    await dbConnect();
    try {
        const interview = await Interview.findByIdAndUpdate(id, updates, { new: true });
        return interview;
    } catch (error) {
        console.error(`Error updating interview ${id}:`, error);
        return null;
    }
};

export const deleteInterview = async (id: string): Promise<boolean> => {
    await dbConnect();
    try {
        const result = await Interview.deleteOne({ _id: id });
        return result.deletedCount === 1;
    } catch (error) {
        console.error(`Error deleting interview ${id}:`, error);
        return false;
    }
};

export const createInterview = async (interviewData: Partial<IInterview>): Promise<IInterview | null> => {
    await dbConnect();
    try {
        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return null;
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;

        const interview = await Interview.create({ ...interviewData, recruitmentId: currentRecruitmentId });
        return interview;
    } catch (error) {
        console.error("Error creating interview:", error);
        return null;
    }
};

export const getInterviews = async (active: boolean = false): Promise<IInterview[]> => {
    await dbConnect();
    try {
        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return [];
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { recruitmentId: currentRecruitmentId };
        if (active) {
            query.active = true;
        }
        const interviews = await Interview.find(query);
        return interviews;
    } catch (error) {
        console.error("Error fetching interviews:", error);
        return [];
    }
};