import { Schema, model, models, Document, Model } from "mongoose";

export interface IForm extends Document {
  provider: "GOOGLE_FORMS" | "CUSTOM";
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
    default: {}
  },
  canCreateUsers: { type: Boolean, default: false },
  formIdentifier: { type: String },
  recruitmentProcessId: { type: String }
});

// Identifiers only have to be unique *within* a recruitment process — reusing
// "entrevista1" in a later period is expected. The partial filter keeps forms
// without an identifier out of the index so they don't collide with each other.
formSchema.index(
  { recruitmentProcessId: 1, formIdentifier: 1 },
  {
    unique: true,
    partialFilterExpression: {
      formIdentifier: { $type: "string" },
      recruitmentProcessId: { $type: "string" }
    },
    name: "recruitmentProcessId_1_formIdentifier_1"
  }
);

const Form = (models.Form as Model<IForm>) || model<IForm>("Form", formSchema);

// Mongoose only ever *adds* indexes, so the old globally-unique `formIdentifier_1`
// index would survive on existing databases and keep rejecting identifiers reused
// from a past recruitment period. Drop it once per process, then let Mongoose
// build the scoped index.
declare global {
  // eslint-disable-next-line no-var
  var __formIndexSyncPromise: Promise<void> | undefined;
}

const syncFormIndexes = async () => {
  try {
    const indexes = await Form.collection.indexes();
    const staleIndex = indexes.find(
      (index) =>
        index.unique &&
        !index.partialFilterExpression &&
        JSON.stringify(index.key) === JSON.stringify({ formIdentifier: 1 })
    );
    if (staleIndex?.name) {
      await Form.collection.dropIndex(staleIndex.name);
      console.log(`Dropped stale globally-unique form index "${staleIndex.name}"`);
    }
    // createIndexes() only adds what the schema declares. syncIndexes() would
    // also drop every index not in the schema, which on a live database could
    // silently remove indexes added by hand.
    await Form.createIndexes();
  } catch (error) {
    // A missing collection (fresh database) or a concurrent build is harmless —
    // the scoped index gets created on first write either way.
    console.warn("Could not reconcile Form indexes:", (error as Error).message);
  }
};

export const ensureFormIndexes = () => {
  if (!global.__formIndexSyncPromise) {
    global.__formIndexSyncPromise = syncFormIndexes();
  }
  return global.__formIndexSyncPromise;
};

export default Form;
