import { Schema, model, models, Document } from "mongoose";

export interface ICommittee extends Document {
  name: string;
  color: string;
}

const committeeSchema: Schema = new Schema({
  name: { type: String, required: true },
  color: { type: String, required: true }
});

export default models.Committee || model<ICommittee>("Committee", committeeSchema);
