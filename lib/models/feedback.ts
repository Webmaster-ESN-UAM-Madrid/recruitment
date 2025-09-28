import { Schema, model, models } from "mongoose";

const feedbackSchema = new Schema({
  candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
  givenBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recruitmentId: { type: String, required: true },
  content: { type: String, required: true },
  isEdited: { type: Boolean, default: false },
  originalContent: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default models.Feedback || model("Feedback", feedbackSchema);
