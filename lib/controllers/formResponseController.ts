import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/form";
import FormResponse from "@/lib/models/formResponse";
import { getCurrentRecruitmentDetails } from "@/lib/controllers/adminController";

export const getFormResponses = async () => {
    await dbConnect();
    try {
        const recruitmentDetails = await getCurrentRecruitmentDetails();
        if (!recruitmentDetails.currentRecruitment) {
            console.error("Could not retrieve current recruitment details.");
            return { status: 500, message: "Could not determine current recruitment" };
        }
        const currentRecruitmentId = recruitmentDetails.currentRecruitment;

        const formsInCurrentRecruitment = await Form.find({ recruitmentProcessId: currentRecruitmentId }).select("_id");
        const formIds = formsInCurrentRecruitment.map((form) => form._id);

        const formResponses = await FormResponse.find({
            formId: { $in: formIds },
        });

        return { status: 200, data: formResponses };
    } catch (error) {
        console.error("Error fetching all form responses for current recruitment:", error);
        return { status: 500, message: "Internal server error" };
    }
};
