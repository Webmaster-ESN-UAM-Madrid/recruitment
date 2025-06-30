import { useState } from 'react';
import Question from './Question';

interface QuestionType {
  id: string;
  text: string;
  type: string;
  title: string; // Added title property
  options?: string[];
  rows?: string[];
  columns?: string[];
}

export interface FormSection {
  0: string;
  1: QuestionType[];
}

interface FormPreviewProps {
  formStructure: FormSection[];
  formId: string;
}

const FormPreview = ({ formStructure, formId }: FormPreviewProps) => {
  const [fieldMappings, setFieldMappings] = useState({});

  const handleMappingChange = (questionId: string, fieldType: string) => {
    setFieldMappings(prev => ({ ...prev, [questionId]: fieldType }));
  };

  const saveMappings = async () => {
    await fetch(`/api/forms/${formId}/map`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldMappings }),
    });
  };

  return (
    <div>
      <h2>Form Preview</h2>
      {formStructure.map((section, index) => (
        <div key={index}>
          <h3>{section[0]}</h3>
          {section[1].map(question => (
            <Question
              key={question.id}
              question={question}
              onMappingChange={handleMappingChange}
            />
          ))}
        </div>
      ))}
      <button onClick={saveMappings}>Save Mappings</button>
    </div>
  );
};

export default FormPreview;