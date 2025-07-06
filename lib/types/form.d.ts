export interface FormField {
  id: number;
  type: string;
  title: string;
  description?: string;
  required?: boolean;
  options?: string[];
  rows?: string[];
  columns?: string[];
}

export type FormSection = [string, FormField[]];

export type FormStructure = FormSection[];
