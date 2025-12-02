import mongoose, { Schema, Document } from "mongoose";

export interface IAvailability extends Document {
  userId: string;
  recruitmentId: string;
  slots: Date[]; // Start times of 30-min slots
}

const AvailabilitySchema: Schema = new Schema({
  userId: { type: String, required: true },
  recruitmentId: { type: String, required: true },
  slots: { type: [Date], default: [] }
});

// Compound index to ensure one availability document per user per recruitment
AvailabilitySchema.index({ userId: 1, recruitmentId: 1 }, { unique: true });

export default mongoose.models.Availability ||
  mongoose.model<IAvailability>("Availability", AvailabilitySchema);
