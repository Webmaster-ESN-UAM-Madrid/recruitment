import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  name: string;
  image?: string;
  newbie?: boolean;
  notes?: Map<string, string>;
  ratings?: Map<string, number | null>;
  newbieCandidateSelections?: string[];
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String },
  newbie: { type: Boolean, default: false },
  notes: { type: Map, of: String, default: new Map() },
  ratings: { type: Map, of: Number, default: new Map() },
  newbieCandidateSelections: { type: [String], default: [] }
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
