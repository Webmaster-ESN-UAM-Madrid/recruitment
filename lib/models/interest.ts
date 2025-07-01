import { Schema, Document, models, model } from 'mongoose';

export interface IInterest extends Document {
  name: string;
  color: string;
}

const InterestSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  color: { type: String, required: true },
});

export default models.Interest || model<IInterest>('Interest', InterestSchema);
