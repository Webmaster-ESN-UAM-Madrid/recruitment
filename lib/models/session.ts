import { Schema, model, models, Document } from "mongoose";

export interface ISession extends Document {
  userId: Schema.Types.ObjectId;
  expires: Date;
  sessionToken: string;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expires: { type: Date, required: true },
  sessionToken: { type: String, required: true, unique: true },
});

export default models.Session || model<ISession>("Session", sessionSchema);
