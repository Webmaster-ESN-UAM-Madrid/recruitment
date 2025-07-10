import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  name: string;
  image?: string;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);