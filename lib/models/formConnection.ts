import mongoose, { Schema, Document } from "mongoose";

export interface IFormConnection extends Document {
    key: string;
    provider: "GOOGLE_FORMS" | "CUSTOM";
    appsScriptId?: string;
    expiresAt: Date;
    formData?: string;
    validationCode?: string;
    canCreateUsers?: boolean;
    formIdentifier?: string;
}

const FormConnectionSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true },
    provider: { type: String, required: true },
    appsScriptId: { type: String },
    expiresAt: { type: Date, required: true },
    formData: { type: String },
    validationCode: { type: String },
    canCreateUsers: { type: Boolean },
    formIdentifier: { type: String }
});

export default mongoose.models.FormConnection || mongoose.model<IFormConnection>("FormConnection", FormConnectionSchema);
