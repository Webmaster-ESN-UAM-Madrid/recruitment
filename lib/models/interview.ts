import { Schema, model, models, Document } from "mongoose";

export interface IInterview extends Document {
    _id: string;
    recruitmentId: string;
    interviewers: string[];
    candidates: string[];
    date: Date;
    format: "online" | "presencial";
    opinions: {
        [candidateId: string]: {
            interviewers: {
                [interviewerId: string]: {
                    opinion: string;
                };
            };
            status: "unset" | "present" | "delayed" | "absent" | "cancelled";
        };
    };
}

const interviewSchema = new Schema<IInterview>({
    recruitmentId: { type: String, required: true },
    interviewers: [{ type: Schema.Types.ObjectId, required: true, ref: "User" }],
    candidates: [{ type: Schema.Types.ObjectId, required: true, ref: "Candidate" }],
    date: { type: Date, required: true },
    format: { type: String, enum: ["online", "presencial"], required: true, default: "presencial" },
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
            }
        }),
        default: {}
    }
});

export default models.Interview || model<IInterview>("Interview", interviewSchema);