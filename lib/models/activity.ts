import { Schema, model, models, Document } from "mongoose";

export interface IActivity extends Document {
  title: string;
  slug: string;
  candidates: string[]; // Array of Candidate IDs
  recruitmentId: string;
  committee?: string; // Committee name
  date?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    candidates: [{ type: String, required: true }],
    recruitmentId: { type: String, required: true },
    committee: { type: String },
    date: { type: Date },
    endDate: { type: Date }
  },
  { timestamps: true }
);

export default models.Activity || model<IActivity>("Activity", activitySchema);
