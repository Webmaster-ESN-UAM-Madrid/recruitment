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
};

export const updateInterview = async (id: string, updates: Partial<IInterview>): Promise<IInterview | null> => {
    await dbConnect();
    try {
        const { opinions, ...restOfUpdates } = updates;

        const interview = await Interview.findById(id);
        if (!interview) {
            return null;
        }

        Object.assign(interview, restOfUpdates);

        if (opinions) {
            for (const candidateId in opinions) {
                if (Object.prototype.hasOwnProperty.call(opinions, candidateId)) {
                    const opinionUpdate = opinions[candidateId];
                    const existingOpinion = interview.opinions.get(candidateId);

                    if (existingOpinion) {
                        if (opinionUpdate.interviewers) {
                            for (const interviewerId in opinionUpdate.interviewers) {
                                if (Object.prototype.hasOwnProperty.call(opinionUpdate.interviewers, interviewerId)) {
                                    existingOpinion.interviewers.set(interviewerId, opinionUpdate.interviewers[interviewerId]);
                                }
                            }
                        }
                        if (opinionUpdate.status && opinionUpdate.status !== 'unset') {
                            existingOpinion.status = opinionUpdate.status;
                        }
                    } else {
                        interview.opinions.set(candidateId, opinionUpdate);
                    }
                }
            }
        }

        const updatedInterview = await interview.save();
        return updatedInterview;
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

export const getInterviews = async (active: boolean = false, past: boolean = false): Promise<IInterview[]> => {
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
        if (past) {
            query.date = { $lt: new Date() };
        }
        const interviews = await Interview.find(query);
        return interviews;
    } catch (error) {
        console.error("Error fetching interviews:", error);
        return [];
    }
};
