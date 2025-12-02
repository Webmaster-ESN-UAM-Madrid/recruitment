import Availability, { IAvailability } from "@/lib/models/availability";
import dbConnect from "@/lib/mongodb";
import { getCurrentRecruitmentDetails } from "@/lib/controllers/adminController";

export const getAvailabilities = async (): Promise<IAvailability[]> => {
  await dbConnect();
  try {
    const recruitmentDetails = await getCurrentRecruitmentDetails();
    if (!recruitmentDetails.currentRecruitment) {
      console.error("Could not retrieve current recruitment details.");
      return [];
    }
    const currentRecruitmentId = recruitmentDetails.currentRecruitment;

    const availabilities = await Availability.find({
      recruitmentId: currentRecruitmentId
    });
    return availabilities;
  } catch (error) {
    console.error("Error fetching availabilities:", error);
    return [];
  }
};

export const updateUserAvailability = async (
  userId: string,
  slots: Date[]
): Promise<IAvailability | null> => {
  await dbConnect();
  try {
    const recruitmentDetails = await getCurrentRecruitmentDetails();
    if (!recruitmentDetails.currentRecruitment) {
      console.error("Could not retrieve current recruitment details.");
      return null;
    }
    const currentRecruitmentId = recruitmentDetails.currentRecruitment;

    const availability = await Availability.findOneAndUpdate(
      { userId, recruitmentId: currentRecruitmentId },
      { slots },
      { new: true, upsert: true }
    );
    return availability;
  } catch (error) {
    console.error(`Error updating availability for user ${userId}:`, error);
    return null;
  }
};
