import { Schema, model, models, Document } from "mongoose";

export interface IConfig extends Document {
    _id: string;
    currentRecruitment: string;
    recruitmentPhase: string;
    recruiters: string[];
}

const configSchema = new Schema({
    _id: { type: String, default: "globalConfig" },
    currentRecruitment: { type: String, required: true },
    recruitmentPhase: { type: String, required: true },
    recruiters: [{ type: String }]
});

export default models.Config || model<IConfig>("Config", configSchema);
