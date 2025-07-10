import { Schema, model, models, Document } from "mongoose";

export interface ICandidate extends Document {
    _id: string;
    recruitmentId: string;
    name: string;
    email: string;
    alternateEmails: string[];
    photoUrl?: string;
    rejectedReason?: string; // Added field
    tags: { tag: string; comment?: string }[]; // Added field
    active: boolean;
    appliedAt: Date;
    tutor?: string;
    interests: Schema.Types.ObjectId[];
}

const tagSchema = new Schema({
    tag: { type: String, required: true },
    comment: { type: String }
}, { _id: false }); // _id: false to prevent Mongoose from creating default _id for subdocuments

const candidateSchema = new Schema({
    recruitmentId: { type: String, required: true },
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    alternateEmails: [
        {
            type: String,
            lowercase: true
        }
    ],
    photoUrl: String,
    rejectedReason: String, // Added field
    tags: [tagSchema], // Added field
    active: { type: Boolean, default: true },
    appliedAt: { type: Date, default: Date.now },
    tutor: { type: String },
    interests: [{ type: Schema.Types.ObjectId, ref: "Committee" }]
});

export default models.Candidate || model<ICandidate>("Candidate", candidateSchema);