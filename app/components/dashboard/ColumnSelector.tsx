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
  align-items: center;
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
    (c) => !c.fixed && isNaN(Number(c.key))
  );

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
        {formStructure.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h4>{section.title}</h4>
            {section.questions.map((question) => {
              const questionKey = question.id.toString();
              const isChecked = visibleColumnIds.includes(questionKey);
              const isDisabled =
                !isChecked && visibleColumnIds.length >= maxColumns;
              const inputId = `question-${question.id}`;

              return (
                <CustomCheckWrapper key={question.id} htmlFor={inputId}>
                  <HiddenInput
                    id={inputId}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggle(questionKey)}
                    disabled={isDisabled}
                  />
                  <CustomCheckbox checked={isChecked} />
                  <span>{question.title}</span>
                </CustomCheckWrapper>
              );
            })}
          </div>
        ))}
      </ColumnSection>
    </ColumnList>
  );
};

export default ColumnSelector;
