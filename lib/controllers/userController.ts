import User from "../models/user";
import dbConnect from "@/lib/mongodb";

export const getUsers = async () => {
    await dbConnect();
    try {
        const users = await User.find({}, "name email");
        return users;
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
};
