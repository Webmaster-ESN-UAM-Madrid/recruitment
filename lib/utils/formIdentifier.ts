/**
 * Form identifiers are used as slugs and are matched case-sensitively elsewhere
 * (e.g. the tasks page looks for identifiers starting with "entrevista"), so they
 * are normalised to a single canonical shape: lowercase, hyphen-separated, and
 * limited to letters, digits and hyphens. Shared by the admin panel input and the
 * API so both agree on the stored value.
 */
export const normalizeFormIdentifier = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents: "diseño" -> "diseno"
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-");

/** Trims leading/trailing hyphens once the user is done editing. */
export const finalizeFormIdentifier = (value: string) =>
  normalizeFormIdentifier(value).replace(/^-+|-+$/g, "");
