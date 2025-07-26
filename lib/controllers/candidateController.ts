import Candidate, { ICandidate } from "@/lib/models/candidate";
import dbConnect from "@/lib/mongodb";
import { getCurrentRecruitmentDetails } from "@/lib/controllers/adminController";
import Interview from "@/lib/models/interview";

export const getCandidateById = async (id: string): Promise<ICandidate | null> => {
    await dbConnect();
    try {
        const candidate = await Candidate.findById(id);
        return candidate;
    } catch (error) {
        console.error(`Error fetching candidate by ID ${id}:`, error);
        return null;
    }
};

export const updateCandidate = async (id: string, updates: Partial<ICandidate>): Promise<ICandidate | null> => {
    await dbConnect();
    try {
        const candidate = await Candidate.findByIdAndUpdate(id, updates, { new: true });
        return candidate;
    } catch (error) {
        console.error(`Error updating candidate ${id}:`, error);
        return null;
    }
};

export const deleteCandidate = async (id: string): Promise<boolean> => {
    await dbConnect();
    try {
        const result = await Candidate.deleteOne({ _id: id });
        return result.deletedCount === 1;
    } catch (error) {
        console.error(`Error deleting candidate ${id}:`, error);
        return false;
    }
};

export const createCandidate = async (candidateData: Partial<ICandidate>): Promise<ICandidate | null> => {
    await dbConnect();
    try {
        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return null;
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;
        const currentRecruitmentPhase = recruitmentDetails.recruitmentPhase;

        const candidate = await Candidate.create({
            ...candidateData,
            recruitmentId: currentRecruitmentId,
            recruitmentPhase: currentRecruitmentPhase
        });
        return candidate;
    } catch (error) {
        console.error("Error creating candidate:", error);
        return null;
    }
};

export const getCandidates = async (active: boolean = false): Promise<ICandidate[]> => {
    await dbConnect();
    try {
        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return [];
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;
        const currentRecruitmentPhase = recruitmentDetails.recruitmentPhase;

        await Candidate.updateMany(
            {
                recruitmentId: currentRecruitmentId,
                recruitmentPhase: { $exists: false }
            },
            {
                $set: {
                    recruitmentPhase: currentRecruitmentPhase,
                    emailSent: true
                }
            }
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { recruitmentId: currentRecruitmentId };
        if (active) {
            query.active = true;
        }
        const candidates = await Candidate.find(query);
        return candidates;
    } catch (error) {
        console.error("Error fetching candidates:", error);
        return [];
    }
};

export const addAlternateEmail = async (id: string, email: string): Promise<ICandidate | null> => {
    await dbConnect();
    try {
        const candidate = await Candidate.findById(id);
        if (candidate) {
            candidate.alternateEmails.push(email);
            await candidate.save();
        }
        return candidate;
    } catch (error) {
        console.error(`Error adding alternate email to candidate ${id}:`, error);
        return null;
    }
};

export const getTasksStatus = async (userId: string) => {
    await dbConnect();
    try {
        const now = new Date();
        const interviews = await Interview.find({
            interviewers: userId,
            opinions: { $exists: true },
            date: { $lte: now }
        }).populate("candidates");

        const pendingFeedback = interviews.filter((interview) => {
            for (const candidate of interview.candidates) {
                const candidateId = candidate._id.toString();
                if (!interview.opinions.get(candidateId)?.interviewers.get(userId)?.opinion) {
                    return true;
                }
            }
            return false;
        });

        const candidates = await getCandidates();
        const pendingEmails = candidates.some((c) => !c.emailSent);

        return {
            personalTasks: pendingFeedback.length,
            hasGlobalTasks: pendingEmails
        };
    } catch (error) {
        console.error("Error fetching tasks status:", error);
        return {
            personalTasks: 0,
            hasGlobalTasks: false
        };
    }
};
