import mongoose, { Schema, Document, Mixed } from "mongoose";
import "@/lib/models/form"; // Ensure Form model is loaded
import { IForm } from "@/lib/models/form";

export interface IFormResponse extends Document {
    formId: mongoose.Types.ObjectId | IForm; // Reference to the Form model
    respondentEmail?: string;
    responses: Map<string, Mixed>;
    processed: boolean;
    submittedAt: Date;
    candidateId?: mongoose.Types.ObjectId; // Reference to the Candidate model
}

const FormResponseSchema: Schema = new Schema({
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true },
    respondentEmail: { type: String },
    responses: {
        type: Map,
        of: Schema.Types.Mixed,
        required: true
    },
    processed: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate" } // Reference to the Candidate model
});

export default mongoose.models.FormResponse || mongoose.model<IFormResponse>("FormResponse", FormResponseSchema);
