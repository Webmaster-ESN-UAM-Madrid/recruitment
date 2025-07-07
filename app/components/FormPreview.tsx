'use client';

import Question from "./Question";
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { ButtonProvider } from './buttons/IconButton';
import { SaveButton } from './buttons/SaveButton';
import { CancelButton } from './buttons/CancelButton';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

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
  isAccordion?: boolean;
  startsExpanded?: boolean;
}

const FormContainer = styled.div`
  border: 2px solid #eee;
  border-radius: var(--border-radius-md); /* Apply rounded corners */
  padding: 20px;
  padding-bottom: 0;
  margin-top: 15px;
`;

const AccordionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: 20px;
`;

const AccordionContent = styled.div<{ expanded: boolean; }>`
  display: grid;
  grid-template-rows: ${({ expanded }) => (expanded ? '1fr' : '0fr')};
  transition: grid-template-rows 0.5s ease-in-out;
  overflow: hidden;

  & > div {
    overflow: hidden;
  }
`;

const SectionTitle = styled.h3`
  margin-top: 20px;
  margin-bottom: 10px;
  color: #333;
  font-family: 'Montserrat', sans-serif;
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 10px;
  margin-top: -5px;
  margin-bottom: 15px;
`;

const FormPreview: React.FC<FormPreviewProps> = ({ formStructure, responses, isEditing = false, initialMappings, onSaveMappings, onCancelEdit, isAccordion = false, startsExpanded = true }) => {
  const parsedForm: FormSection[] = JSON.parse(formStructure);
  const [currentMappings, setCurrentMappings] = useState<Map<string, string>>(initialMappings || new Map());
  const [nameMapped, setNameMapped] = useState<boolean>(false);
  const [emailMapped, setEmailMapped] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(startsExpanded);

  useEffect(() => {
    if (initialMappings) {
      setCurrentMappings(initialMappings);
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

    if (oldMapping === 'user.name') setNameMapped(false);
    if (oldMapping === 'user.email') setEmailMapped(false);

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

  const toggleAccordion = () => {
    if (isAccordion) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <FormContainer>
      {isAccordion && (
        <AccordionHeader onClick={toggleAccordion}>
          <SectionTitle>{parsedForm[0][0]}</SectionTitle>
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </AccordionHeader>
      )}
      <AccordionContent expanded={isExpanded}>
        <div>
          {parsedForm.map((section, sectionIndex) => {
            const [sectionTitle, fields] = section;
            return (
              <div key={sectionIndex}>
                {!isAccordion && <SectionTitle>{sectionTitle}</SectionTitle>}
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
            <ButtonProvider>
              <ButtonWrapper>
                <SaveButton isLoading={isSaving} onClick={handleSave} />
                <CancelButton isLoading={isSaving} onClick={handleCancel} />
              </ButtonWrapper>
            </ButtonProvider>
          )}
        </div>
      </AccordionContent>
    </FormContainer>
  );
};

export default FormPreview;