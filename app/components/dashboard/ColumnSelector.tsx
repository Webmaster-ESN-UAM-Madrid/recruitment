import React from 'react';
import styled from 'styled-components';

// Styled components
const ColumnList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ColumnSection = styled.div`
  margin-bottom: 15px;
`;

const SectionHeader = styled.h3`
  margin-bottom: 10px;
  color: #333;
`;

const HiddenInput = styled.input`
  display: none;
`;

const CustomCheckWrapper = styled.label`
  display: flex;
  gap: 8px;
  cursor: pointer;

  input:disabled + span {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const CustomCheckbox = styled.span<{ checked: boolean }>`
  width: 16px;
  height: 16px;
  display: inline-block;
  border: 2px solid ${({ checked }) => (checked ? '#0070f0' : '#ccc')};
  background-color: ${({ checked }) => (checked ? '#57a5ff' : '#fff')};
  border-radius: 3px;
  position: relative;
  box-sizing: border-box;
  flex-shrink: 0;

  &::after {
    content: '';
    display: ${({ checked }) => (checked ? 'block' : 'none')};
    position: absolute;
    left: 4px;
    top: 0px;
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`;

const CustomLabel = styled.span`
  flex: 1;
`;

// Interfaces
interface FormQuestion {
  id: number;
  title: string;
  description: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface FormSection {
  title: string;
  questions: FormQuestion[];
}

interface Column {
  key: string;
  header: string;
  fixed: boolean;
  width: string;
  fullWidth?: string;
}

interface ColumnSelectorProps {
  allColumns: Column[];
  formStructure: FormSection[];
  visibleColumnIds: string[];
  onColumnToggle: (columnId: string) => void;
  maxColumns?: number;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  allColumns,
  formStructure,
  visibleColumnIds,
  onColumnToggle,
  maxColumns = 3,
}) => {
  const handleToggle = (columnKey: string) => {
    const isCurrentlyVisible = visibleColumnIds.includes(columnKey);
    if (!isCurrentlyVisible && visibleColumnIds.length >= maxColumns) {
      return;
    }
    onColumnToggle(columnKey);
  };

  const customNonFixedColumns = allColumns.filter(
    (c) => !c.fixed && isNaN(Number(c.key)) && !c.key.includes(':')
  );

  // Group sections by unique formKey (may be `${formId}|${formIdentifier}`)
  const groupedByForm = formStructure.reduce((acc, section) => {
    const [formKey, sectionTitle] = section.title.split(': ', 2);

    if (!acc[formKey]) {
      acc[formKey] = [];
    }

    acc[formKey].push({ ...section, title: sectionTitle });
    return acc;
  }, {} as Record<string, FormSection[]>);

  return (
    <ColumnList>
      <ColumnSection>
        <SectionHeader>Columnas Personalizadas</SectionHeader>
        {customNonFixedColumns.map((column) => {
          const isChecked = visibleColumnIds.includes(column.key);
          const isDisabled = !isChecked && visibleColumnIds.length >= maxColumns;
          const inputId = `column-${column.key}`;

          return (
            <CustomCheckWrapper key={column.key} htmlFor={inputId}>
              <HiddenInput
                id={inputId}
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggle(column.key)}
                disabled={isDisabled}
              />
              <CustomCheckbox checked={isChecked} />
              <span>{column.header}</span>
            </CustomCheckWrapper>
          );
        })}
      </ColumnSection>

      <ColumnSection>
        <SectionHeader>Respuestas de Formulario</SectionHeader>
        {Object.entries(groupedByForm).map(([formKey, sections]) => {
          const displayName = formKey.includes('|') ? formKey.split('|', 2)[1] : formKey;
          return (
          <div key={formKey}>
            <h4 style={{ marginTop: 16 }}>Respuestas al formulario &quot;{displayName}&quot;</h4>
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h5>{section.title}</h5>
                {section.questions.map((question) => {
                  const questionKey = `${formKey}:${question.id}`;
                  const isChecked = visibleColumnIds.includes(questionKey);
                  const isDisabled =
                    !isChecked && visibleColumnIds.length >= maxColumns;
                  const safeFormKey = formKey.replaceAll('|', '-');
                  const inputId = `question-${safeFormKey}-${question.id}`;

                  return (
                    <CustomCheckWrapper key={`${formKey}-${question.id}`} htmlFor={inputId}>
                      <HiddenInput
                        id={inputId}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(questionKey)}
                        disabled={isDisabled}
                      />
                      <CustomCheckbox checked={isChecked} />
                      <CustomLabel>{question.title}</CustomLabel>
                    </CustomCheckWrapper>
                  );
                })}
              </div>
            ))}
          </div>
        );})}
      </ColumnSection>
    </ColumnList>
  );
};

export default ColumnSelector;