interface Feedback {
    id: string;
    message: string;
    // Add other properties as needed
}

export const updateFeedback = async (feedback: Feedback) => {
    console.log("updateFeedback called with:", feedback);
    return { success: true, updatedId: feedback.id };
};

export const deleteFeedback = async (id: string) => {
    console.log(`deleteFeedback called with id: ${id}`);
    return { success: true, deletedId: id };
};

export const createFeedback = async (feedback: Feedback) => {
    console.log("createFeedback called with:", feedback);
    return { success: true, createdId: "new-feedback-id" };
};

export const getFeedback = async () => {
    console.log("getFeedback called");
    return [{ id: "1", message: "Feedback 1" }, { id: "2", message: "Feedback 2" }];
};