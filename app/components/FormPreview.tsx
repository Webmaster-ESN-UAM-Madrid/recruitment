'use client';

import React from 'react';
import styled from 'styled-components';
import Question from './Question';

// interface FormField {
//   id: number;
//   type: string;
//   title: string;
//   description?: string;
//   required?: boolean;
//   options?: string[];
//   rows?: string[];
//   columns?: string[];
// }

// // This represents a section: [sectionTitle: string, fields: FormField[]]
// type FormSection = [string, FormField[]];

interface FormPreviewProps {
  formStructure: string; // FormSection[];
  responses: Map<string, string | number | boolean | object>;
}

const FormContainer = styled.div`
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  margin-top: 15px;
`;

const SectionTitle = styled.h3`
  margin-top: 20px;
  margin-bottom: 10px;
  color: #333;
`;

const FormPreview: React.FC<FormPreviewProps> = ({ formStructure, responses }) => {
  const parsedForm = JSON.parse(formStructure);

  if (!parsedForm || !Array.isArray(parsedForm)) {
    return <p>No form structure available or invalid format.</p>;
  }

  const getFieldValue = (fieldId: number) => {
    return responses.get(String(fieldId)); // Convert fieldId to string for Map key
  };

  return (
    <FormContainer>
      {parsedForm.map((section, sectionIndex) => {
        const [sectionTitle, fields] = section;
        return (
          <div key={sectionIndex}>
            <SectionTitle>{sectionTitle}</SectionTitle>
            {Array.isArray(fields) && fields.map((field) => (
              <Question key={field.id} question={field} responseValue={getFieldValue(field.id)} />
            ))}
          </div>
        );
      })}
    </FormContainer>
  );
};

export default FormPreview;