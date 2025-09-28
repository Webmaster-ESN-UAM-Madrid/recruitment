import Committee, { ICommittee } from "@/lib/models/committee";
import dbConnect from "@/lib/mongodb";

export const getCommittees = async (): Promise<ICommittee[]> => {
  await dbConnect();
  try {
    const committees = await Committee.find({});
    return committees;
  } catch (error) {
    console.error("Error fetching committees:", error);
    return [];
  }
};

export const createCommittee = async (
  committeeData: Partial<ICommittee>
): Promise<ICommittee | null> => {
  await dbConnect();
  try {
    const newCommittee = new Committee(committeeData);
    await newCommittee.save();
    return newCommittee;
  } catch (error) {
    console.error("Error creating committee:", error);
    return null;
  }
};

export const updateCommittee = async (
  id: string,
  updates: Partial<ICommittee>
): Promise<ICommittee | null> => {
  await dbConnect();
  try {
    const updatedCommittee = await Committee.findByIdAndUpdate(id, updates, { new: true });
    return updatedCommittee;
  } catch (error) {
    console.error(`Error updating committee ${id}:`, error);
    return null;
  }
};

export const deleteCommittee = async (id: string): Promise<boolean> => {
  await dbConnect();
  try {
    const result = await Committee.deleteOne({ _id: id });
    return result.deletedCount === 1;
  } catch (error) {
    console.error(`Error deleting committee ${id}:`, error);
    return false;
  }
};
