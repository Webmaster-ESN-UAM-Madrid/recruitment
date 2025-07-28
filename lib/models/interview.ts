import { Schema, model, models, Document } from "mongoose";

export interface IInterview extends Document {
    _id: string;
    recruitmentId: string;
    location: string;
    interviewers: string[];
    candidates: string[];
    date: Date;
    online: boolean;
    opinions: {
        [candidateId: string]: {
            interviewers: {
                [interviewerId: string]: {
                    opinion: string;
                };
            };
            status: "unset" | "present" | "delayed" | "absent" | "cancelled";
            interviewNotified: boolean;
            interviewConfirmed: boolean;
        };
    };
}

const interviewSchema = new Schema<IInterview>({
    recruitmentId: { type: String, required: true },
    location: { type: String, default: "" },
    interviewers: [{ type: Schema.Types.ObjectId, required: true, ref: "User" }],
    candidates: [{ type: Schema.Types.ObjectId, required: true, ref: "Candidate" }],
    date: { type: Date, required: true },
    online: { type: Boolean, required: true, default: false },
    opinions: {
        type: Map,
        of: new Schema({
            interviewers: {
                type: Map,
                of: new Schema({
                    opinion: { type: String, required: true }
                }),
                default: {}
            },
            status: {
                type: String,
                enum: ["unset", "present", "delayed", "absent", "cancelled"],
                default: "unset"
            },
            interviewNotified: { type: Boolean, default: false },
            interviewConfirmed: { type: Boolean, default: false }
        }),
        default: {}
    }
});

export default models.Interview || model<IInterview>("Interview", interviewSchema);