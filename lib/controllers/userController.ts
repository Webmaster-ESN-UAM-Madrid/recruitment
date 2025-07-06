import User from '../models/user';
import connectToDatabase from '../mongodb';

export const getUsers = async () => {
    await connectToDatabase();
    try {
        const users = await User.find({}, 'name email');
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};
