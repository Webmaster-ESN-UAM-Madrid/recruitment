import { Schema, model, models, Document } from "mongoose";

export interface IConfig extends Document {
  _id: string;
  currentRecruitment: string;
  recruitmentPhase: string;
  recruiters: string[];
  availability: {
    startDate: Date;
    endDate: Date;
    hourRanges: { start: number; end: number }[];
  };
}

const configSchema = new Schema({
  _id: { type: String, default: "globalConfig" },
  currentRecruitment: { type: String, required: true },
  recruitmentPhase: { type: String, required: true },
  recruiters: [{ type: String }],
  availability: {
    startDate: { type: Date },
    endDate: { type: Date },
    hourRanges: [
      {
        start: { type: Number },
        end: { type: Number }
      }
    ]
  }
});

export default models.Config || model<IConfig>("Config", configSchema);
