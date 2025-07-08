import styled from 'styled-components';

interface QuestionType {
  id: number;
  title: string;
  type: string;
  description?: string;
  required?: boolean;
  options?: string[];
  rows?: string[];
  columns?: string[];
}

interface QuestionProps {
  question: QuestionType;
  responseValue?: string | number | boolean | object | string[];
  isEditing?: boolean;
  mappingOptions?: string[];
  currentMapping?: string;
  onMappingChange?: (questionId: number, mapping: string) => void;
  nameMapped?: boolean;
  emailMapped?: boolean;
}

const FormGroup = styled.div`
  margin-bottom: 15px;
  padding: 10px;
  border-radius: var(--border-radius-md);
  border: 2px solid var(--bg-tertiary);

  &:hover {
    // Go up slightly and add a shadow on hover
    transform: translateY(-2px);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    // Transition effect for smoothness
    transition: transform 0.2s ease, box-shadow 0.2s ease
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  font-family: 'Inter', sans-serif;
`;

const Description = styled.p`
  font-size: 0.9em;
  color: var(--text-secondary);
  margin-bottom: 10px;
  font-family: 'Inter', sans-serif;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-md);
  background-color: #e9e9e9;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-md);
  background-color: #e9e9e9;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-md);
  background-color: #f4f4f4;
  min-height: 80px;
  resize: vertical;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const HiddenInput = styled.input`
  display: none;
`;

const CustomCheckWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: default;
`;

const CustomCheckbox = styled.span<{ checked: boolean }>`
  width: 16px;
  height: 16px;
  display: inline-block;
  border: 2px solid ${({ checked }) => (checked ? 'var(--brand-primary)' : '#ccc')};
  background-color: ${({ checked }) => (checked ? '#57a5ff' : 'var(--bg-primary)')};
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

const CustomRadio = styled.span<{ checked: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid ${({ checked }) => (checked ? 'var(--brand-primary)' : '#ccc')};
  background-color: ${({ checked }) =>
    checked ? '#57a5ff' : 'var(--bg-primary)'};
  display: inline-block;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 10px;
  border-radius: var(--border-radius-md);
  overflow: hidden;

  th,
  td {
    border: 1px solid var(--border-primary);
    padding: 8px;
    text-align: center;
  }

  th {
    background-color: var(--bg-tertiary);
  }
`;

const MappingDropdownContainer = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-secondary);
  display: flex;
  align-items: center;
  gap: 10px;

  select {
    flex-grow: 1;
    max-width: 300px; /* Limit width for better aesthetics */
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: var(--border-radius-md);
    background-color: #fff;
    font-size: 0.9em;
    cursor: pointer;
    -webkit-appearance: none; /* Remove default browser styling */
    -moz-appearance: none;
    appearance: none;
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 256 256%22 fill%3D%22%23333%22%3E%3Cpath d%3D%22M208 96L128 176 48 96z%22%2F%3E%3C%2Fsvg%3E'); /* Custom arrow */
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 12px;

    &:focus {
      border-color: var(--border-focus);
      outline: none;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }
  }
`;

const Question = ({
  question,
  responseValue,
  isEditing,
  mappingOptions,
  currentMapping,
  onMappingChange,
  nameMapped,
  emailMapped,
}: QuestionProps) => {
  const displayValue =
    responseValue !== null &&
    responseValue !== undefined &&
    responseValue !== ''
      ? String(responseValue)
      : question?.required ? 'N/A' : '';

  const renderQuestionType = () => {
    switch (question.type) {
      case 'TEXT':
      case 'DATE':
        return (
          <Input
            id={`question-${question.id}`}
            type={question.type === 'DATE' ? 'date' : 'text'}
            value={displayValue}
            disabled
          />
        );
      case 'PARAGRAPH_TEXT':
        return (
          <TextArea
            id={`question-${question.id}`}
            value={displayValue}
            disabled
          />
        );
      case 'MULTIPLE_CHOICE':
        return (
          <CheckboxGroup>
            {question.options?.map((option, index) => {
              const inputId = `question-${question.id}-option-${index}`;
              const isChecked = responseValue === option;

              return (
                <CustomCheckWrapper key={option} htmlFor={inputId}>
                  <HiddenInput
                    id={inputId}
                    type="radio"
                    checked={isChecked}
                    disabled
                  />
                  <CustomRadio checked={isChecked} />
                  <span>{option}</span>
                </CustomCheckWrapper>
              );
            })}
          </CheckboxGroup>
        );
      case 'CHECKBOX':
        return (
          <CheckboxGroup>
            {question.options?.map((option, index) => {
              const inputId = `question-${question.id}-option-${index}`;
              const isChecked =
                Array.isArray(responseValue) && responseValue.includes(option);

              return (
                <CustomCheckWrapper key={option} htmlFor={inputId}>
                  <HiddenInput
                    id={inputId}
                    type="checkbox"
                    checked={isChecked}
                    disabled
                  />
                  <CustomCheckbox checked={isChecked} />
                  <span>{option}</span>
                </CustomCheckWrapper>
              );
            })}
          </CheckboxGroup>
        );
      case 'LIST':
        return (
          <Select 
            id={`question-${question.id}`}
            value={displayValue}
            disabled
          >
            {question.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        );
      case 'GRID':
      case 'CHECKBOX_GRID':
        const isCheckboxGrid = question.type === 'CHECKBOX_GRID';
        const currentResponse = Array.isArray(responseValue)
          ? responseValue
          : [];

        return (
          <Table>
            <thead>
              <tr>
                <th></th>
                {question.columns?.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.rows?.map((row, rowIndex) => (
                <tr key={row}>
                  <td>{row}</td>
                  {question.columns?.map((col) => {
                    const isChecked = currentResponse[rowIndex] === col;
                    return (
                      <td key={col}>
                        <HiddenInput
                          type={isCheckboxGrid ? 'checkbox' : 'radio'}
                          checked={isChecked}
                          disabled
                        />
                        {isCheckboxGrid ? (
                          <CustomCheckbox checked={isChecked} />
                        ) : (
                          <CustomRadio checked={isChecked} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        );
      default:
        return <p>Tipo de pregunta no soportado: {question.type}</p>;
    }
  };

  return (
    <FormGroup>
      <Label htmlFor={`question-${question.id}`}>
        {question.title}
        {question.required && <span style={{ color: '#f00000', marginLeft: -2.5 }}> *</span>}
      </Label>
      {question.description && <Description>{question.description}</Description>}
      {renderQuestionType()}
      {isEditing && mappingOptions && onMappingChange && (
        <MappingDropdownContainer>
          <Select
            value={currentMapping}
            onChange={(e) => onMappingChange(question.id, e.target.value)}
          >
            <option value="none">Ninguno</option>
            <option
              value="user.name"
              disabled={nameMapped && currentMapping !== 'user.name'}
            >
              Nombre de Usuario
            </option>
            <option
              value="user.email"
              disabled={emailMapped && currentMapping !== 'user.email'}
            >
              Correo Electrónico
            </option>
          </Select>
        </MappingDropdownContainer>
      )}
    </FormGroup>
  );
};

export default Question;