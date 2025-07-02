'use client';

import LoadingButton from "./loaders/LoadingButton";
import Question from "./Question";
import styled from 'styled-components';
import { useEffect, useState } from 'react';

interface FormField {
  id: number;
  type: string;
  title: string;
  description?: string;
  required?: boolean;
  options?: string[];
  rows?: string[];
  columns?: string[];
}

type FormSection = [string, FormField[]];

interface FormPreviewProps {
  formStructure: string; // FormSection[];
  responses: Map<string, string | number | boolean | object>;
  isEditing?: boolean; // New prop
  initialMappings?: Map<string, string>; // New prop
  onSaveMappings?: (mappings: Map<string, string>) => void; // New prop
  onCancelEdit?: () => void; // New prop
}

const FormContainer = styled.div`
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: var(--border-radius-md); /* Apply rounded corners */
  padding: 20px;
  margin-top: 15px;
`;

const SectionTitle = styled.h3`
  margin-top: 20px;
  margin-bottom: 10px;
  color: #333;
  font-family: 'Montserrat', sans-serif; /* Use Montserrat for titles */
`;

const FormPreview: React.FC<FormPreviewProps> = ({ formStructure, responses, isEditing = false, initialMappings, onSaveMappings, onCancelEdit }) => {
  const parsedForm: FormSection[] = JSON.parse(formStructure);
  const [currentMappings, setCurrentMappings] = useState<Map<string, string>>(initialMappings || new Map());
  const [nameMapped, setNameMapped] = useState<boolean>(false);
  const [emailMapped, setEmailMapped] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialMappings) {
      setCurrentMappings(initialMappings);
      // Initialize nameMapped and emailMapped based on initialMappings
      let tempNameMapped = false;
      let tempEmailMapped = false;
      initialMappings.forEach((value) => {
        if (value === 'user.name') tempNameMapped = true;
        if (value === 'user.email') tempEmailMapped = true;
      });
      setNameMapped(tempNameMapped);
      setEmailMapped(tempEmailMapped);
    }
  }, [initialMappings]);

  if (!parsedForm || !Array.isArray(parsedForm)) {
    return <p>Estructura de formulario no disponible o formato inválido.</p>;
  }

  const getFieldValue = (fieldId: number) => {
    return responses.get(String(fieldId));
  };

  const handleMappingChange = (questionId: number, mapping: string) => {
    const newMappings = new Map(currentMappings);
    const oldMapping = newMappings.get(String(questionId));

    // Remove old mapping if it exists
    if (oldMapping === 'user.name') setNameMapped(false);
    if (oldMapping === 'user.email') setEmailMapped(false);

    // Add new mapping
    if (mapping === 'none') {
      newMappings.delete(String(questionId));
    } else {
      newMappings.set(String(questionId), mapping);
      if (mapping === 'user.name') setNameMapped(true);
      if (mapping === 'user.email') setEmailMapped(true);
    }
    setCurrentMappings(newMappings);
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (onSaveMappings) {
      await onSaveMappings(currentMappings);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <FormContainer>
      {parsedForm.map((section, sectionIndex) => {
        const [sectionTitle, fields] = section;
        return (
          <div key={sectionIndex}>
            <SectionTitle>{sectionTitle}</SectionTitle>
            {Array.isArray(fields) && fields.map((field) => (
              <Question
                key={field.id}
                question={field}
                responseValue={getFieldValue(field.id)}
                isEditing={isEditing}
                mappingOptions={['none', 'user.name', 'user.email']}
                currentMapping={currentMappings.get(String(field.id)) || 'none'}
                onMappingChange={handleMappingChange}
                nameMapped={nameMapped}
                emailMapped={emailMapped}
              />
            ))}
          </div>
        );
      })}
      {isEditing && (
        <div>
          <LoadingButton isLoading={isSaving} onClick={handleSave}>Guardar Mapeos</LoadingButton>
          <LoadingButton isLoading={isSaving} onClick={handleCancel} style={{ marginLeft: '10px' }}>Cancelar</LoadingButton>
        </div>
      )}
    </FormContainer>
  );
};

export default FormPreview;