import { Schema, model, models, Document } from "mongoose";
import type { CandidateEstado } from "@/lib/constants/candidate";

export type EventAttendance = boolean | null;
export type { CandidateEstado };

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
  tanda?: number | null;
  estado?: CandidateEstado | null;
  interests: Schema.Types.ObjectId[];
  events: {
    "Welcome Meeting": EventAttendance;
    "Welcome Days": EventAttendance;
    "Integration Weekend": EventAttendance;
    "Plataforma Local": EventAttendance;
  };
  recruitmentPhase: string;
  emailSent: boolean;
}

const tagSchema = new Schema(
  {
    tag: { type: String, required: true },
    comment: { type: String }
  },
  { _id: false }
); // _id: false to prevent Mongoose from creating default _id for subdocuments

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
  tanda: {
    type: Number,
    default: null,
    validate: {
      validator: (value: number | null | undefined) =>
        value === null || value === undefined || Number.isInteger(value),
      message: "Tanda must be an integer"
    }
  },
  estado: {
    type: String,
    enum: ["yes", "no", "maybe"],
    default: null
  },
  interests: [{ type: Schema.Types.ObjectId, ref: "Committee" }],
  events: {
    "Welcome Meeting": { type: Boolean, default: false },
    "Welcome Days": { type: Boolean, default: false },
    "Integration Weekend": { type: Boolean, default: false },
    "Plataforma Local": { type: Boolean, default: false }
  },
  recruitmentPhase: { type: String },
  emailSent: { type: Boolean, default: true }
});

export default models.Candidate || model<ICandidate>("Candidate", candidateSchema);
