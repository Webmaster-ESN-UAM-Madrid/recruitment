import { Schema, model, models, Document } from "mongoose";

export interface ICommittee {
  name: string;
  color: string;
}

export interface IConfig extends Document {
    _id: string;
    currentRecruitment: string;
    recruitmentPhase: string;
    recruiters: string[]; // Now stores emails directly
    committees: ICommittee[];
}

const configSchema = new Schema({
    _id: { type: String, default: "globalConfig" },
    currentRecruitment: { type: String, required: true },
    recruitmentPhase: { type: String, required: true },
    recruiters: [{ type: String }], // Now stores emails directly
    committees: [{
      name: { type: String, required: true },
      color: { type: String, required: true },
    }],
});

export default models.Config || model<IConfig>("Config", configSchema);
