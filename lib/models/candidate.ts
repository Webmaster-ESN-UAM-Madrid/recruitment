
import { Schema, model, models } from 'mongoose';

const candidateSchema = new Schema({
  recruitmentId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  alternateEmails: [String],
  photoUrl: String,
  active: { type: Boolean, default: true },
  appliedAt: { type: Date, default: Date.now }
});

export default models.Candidate || model('Candidate', candidateSchema);
