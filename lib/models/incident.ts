import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
  type: string;
  details: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: Date;
  resolvedAt?: Date;
}

const IncidentSchema: Schema = new Schema({
  type: { type: String, required: true },
  details: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
});

export default mongoose.models.Incident || mongoose.model<IIncident>('Incident', IncidentSchema);