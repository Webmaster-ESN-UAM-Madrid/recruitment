import Candidate, { ICandidate } from "@/lib/models/candidate";
import dbConnect from "@/lib/mongodb";

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
        const candidate = await Candidate.create(candidateData);
        return candidate;
    } catch (error) {
        console.error("Error creating candidate:", error);
        return null;
    }
};

export const getCandidates = async (active: boolean = false): Promise<ICandidate[]> => {
    await dbConnect();
    try {
        const candidates = await Candidate.find(active ? { active: true } : {});
        return candidates;
    } catch (error) {
        console.error("Error fetching candidates:", error);
        return [];
    }
};
