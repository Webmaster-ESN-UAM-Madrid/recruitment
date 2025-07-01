
import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface ICandidate extends Document {
  recruitmentId: string;
  name: string;
  email: string;
  alternateEmails: string[];
  photoUrl?: string;
  active: boolean;
  appliedAt: Date;
  guide?: string; // Email of the guide
  interests: mongoose.Types.ObjectId[]; // Array of ObjectIds referencing the Interest model
}

const candidateSchema = new Schema({
  recruitmentId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  alternateEmails: [String],
  photoUrl: String,
  active: { type: Boolean, default: true },
  appliedAt: { type: Date, default: Date.now },
  guide: { type: String, ref: 'User' }, // Reference to the User model
  interests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Interest' }] // Reference to the Interest model
});

export default models.Candidate || model<ICandidate>('Candidate', candidateSchema);
