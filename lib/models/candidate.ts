import { Schema, model, models, Document } from "mongoose";

export interface ICandidate extends Document {
    recruitmentId: string;
    name: string;
    email: string;
    alternateEmails: string[];
    photoUrl?: string;
    active: boolean;
    appliedAt: Date;
    guide?: string; // Email of the guide
    interests: string[]; // Array of interest names
}

const candidateSchema = new Schema({
    recruitmentId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    alternateEmails: [String],
    photoUrl: String,
    active: { type: Boolean, default: true },
    appliedAt: { type: Date, default: Date.now },
    guide: { type: String },
    interests: [{ type: String }]
});

export default models.Candidate || model<ICandidate>("Candidate", candidateSchema);
