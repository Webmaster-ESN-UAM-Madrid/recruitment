import { Schema, model, models } from "mongoose";

const logSchema = new Schema({
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  changes: [
    {
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed
    }
  ],
  timestamp: { type: Date, default: Date.now }
});

export default models.Log || model("Log", logSchema);
