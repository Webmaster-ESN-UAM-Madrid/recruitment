import mongoose, { Schema, Document, Mixed } from "mongoose";

export interface IFormResponse extends Document {
    formId: mongoose.Types.ObjectId; // Reference to the Form model
    respondentEmail?: string;
    responses: Array<{ id: number; value: Mixed }>;
    processed: boolean;
    submittedAt: Date;
}

const FormResponseSchema: Schema = new Schema({
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true },
    respondentEmail: { type: String },
    responses: { type: Array, required: true },
    processed: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now }
});

export default mongoose.models.FormResponse || mongoose.model<IFormResponse>("FormResponse", FormResponseSchema);
