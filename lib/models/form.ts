
import { Schema, model, models, Document } from 'mongoose';

export interface IForm extends Document {
  provider: 'GOOGLE_FORMS' | 'CUSTOM';
  appsScriptId?: string;
  structure: string;
  fieldMappings: Map<string, string>;
  canCreateUsers: boolean;
  formIdentifier?: string; // For replaceability
  recruitmentProcessId?: string; // From database config
}

const formSchema = new Schema({
  provider: { type: String, required: true },
  appsScriptId: { type: String },
  structure: { type: String, required: true },
  fieldMappings: {
    type: Map,
    of: String,
    default: {},
  },
  canCreateUsers: { type: Boolean, default: false },
  formIdentifier: { type: String, unique: true, sparse: true }, // Make it unique but allow nulls
  recruitmentProcessId: { type: String },
});

export default models.Form || model<IForm>('Form', formSchema);
