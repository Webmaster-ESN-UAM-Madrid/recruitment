import User from "../models/user";
import dbConnect from "@/lib/mongodb";

export const getUsers = async () => {
    await dbConnect();
    try {
        const users = await User.find({}).select("-notes");
        return users;
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
};

export const updateUserNote = async (userId: string, candidateId: string, note: string) => {
    await dbConnect();
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        if (!user.notes) {
            user.notes = new Map<string, string>();
        }
        user.notes.set(candidateId, note);
        await user.save();
    } catch (error) {
        console.error("Error updating user note:", error);
        throw error;
    }
};

export const getUserNotes = async (userId: string) => {
    await dbConnect();
    try {
        const user = await User.findById(userId).select("notes");
        if (!user) {
            return new Map();
        }
        return user.notes || new Map();
    } catch (error) {
        console.error("Error fetching user notes:", error);
        return new Map();
    }
};

export const updateUserRating = async (userId: string, candidateId: string, rating: number | null) => {
    await dbConnect();
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        if (!user.ratings) {
            user.ratings = new Map<string, number | null>();
        }
        if (rating === null || typeof rating === "undefined") {
            user.ratings.delete(candidateId);
        } else {
            // Clamp rating 1-5
            const r = Math.max(1, Math.min(5, Math.floor(rating)));
            user.ratings.set(candidateId, r);
        }
        await user.save();
    } catch (error) {
        console.error("Error updating user rating:", error);
        throw error;
    }
};

export const getUserRatings = async (userId: string) => {
    await dbConnect();
    try {
        const user = await User.findById(userId).select("ratings");
        if (!user) {
            return new Map<string, number | null>();
        }
        return user.ratings || new Map<string, number | null>();
    } catch (error) {
        console.error("Error fetching user ratings:", error);
        return new Map<string, number | null>();
    }
};

export const deleteUser = async (userId: string) => {
    await dbConnect();
    try {
        const result = await User.findByIdAndDelete(userId);
        if (!result) {
            return { deleted: false, message: "User not found" };
        }
        return { deleted: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { deleted: false, message: "Internal Server Error" };
    }
};
