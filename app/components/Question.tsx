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
  isEditing?: boolean; // New prop
  mappingOptions?: string[]; // New prop
  currentMapping?: string; // New prop
  onMappingChange?: (questionId: number, mapping: string) => void; // New prop
  nameMapped?: boolean; // New prop
  emailMapped?: boolean; // New prop
}

const FormGroup = styled.div`
  margin-bottom: 15px;
  padding: 10px;
  border-radius: var(--border-radius-md);
  border: 1px solid #f0f0f0; /* Lighter border for a softer look */
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  font-family: 'Inter', sans-serif; /* Use Inter for labels */
`;

const Description = styled.p`
  font-size: 0.9em;
  color: #666;
  margin-bottom: 10px;
  font-family: 'Inter', sans-serif; /* Use Inter for descriptions */
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius-md); /* Apply rounded corners */
  background-color: #e9e9e9; /* Make it look disabled */
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius-md); /* Apply rounded corners */
  background-color: #e9e9e9;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius-md); /* Apply rounded corners */
  background-color: #e9e9e9;
  min-height: 80px;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate; /* Use separate to allow border-radius on cells */
  border-spacing: 0; /* Remove space between cells */
  margin-top: 10px;
  border-radius: var(--border-radius-md); /* Apply rounded corners to the table */
  overflow: hidden; /* Hide overflowing content for rounded corners */

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }

  th {
    background-color: #f2f2f2;
  }
`;

const Question = ({ question, responseValue, isEditing, mappingOptions, currentMapping, onMappingChange, nameMapped, emailMapped }: QuestionProps) => {
  const renderQuestionType = () => {
    const displayValue = responseValue !== null && responseValue !== undefined && responseValue !== '' ? String(responseValue) : 'N/D';

    switch (question.type) {
      case 'TEXT':
      case 'DATE':
        return <Input type={question.type === 'DATE' ? 'date' : 'text'} value={displayValue} disabled />;
      case 'PARAGRAPH_TEXT':
        return <TextArea value={displayValue} disabled />;
      case 'MULTIPLE_CHOICE':
        return (
          <CheckboxGroup>
            {question.options?.map(option => (
              <div key={option}>
                <input type="radio" checked={responseValue === option} disabled />
                <label>{option}</label>
              </div>
            ))}
          </CheckboxGroup>
        );
      case 'CHECKBOX':
        return (
          <CheckboxGroup>
            {question.options?.map(option => (
              <div key={option}>
                <input type="checkbox" checked={Array.isArray(responseValue) && responseValue.includes(option)} disabled />
                <label>{option}</label>
              </div>
            ))}
          </CheckboxGroup>
        );
      case 'LIST': // Assuming LIST is a dropdown/select
        return (
          <Select value={displayValue} disabled>
            {question.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        );
      case 'GRID':
      case 'CHECKBOX_GRID':
        const isCheckboxGrid = question.type === 'CHECKBOX_GRID';
        const currentResponse = Array.isArray(responseValue) ? responseValue : [];

        return (
          <Table>
            <thead>
              <tr>
                <th></th>
                {question.columns?.map(col => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {question.rows?.map((row, rowIndex) => (
                <tr key={row}>
                  <td>{row}</td>
                  {question.columns?.map(col => {
                    const isChecked = currentResponse[rowIndex] === col;
                    return (
                      <td key={col}>
                        <input
                          type={isCheckboxGrid ? 'checkbox' : 'radio'}
                          checked={isChecked}
                          disabled
                        />
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
      <Label>{question.title}{question.required && " *"}</Label>
      {question.description && <Description>{question.description}</Description>}
      {renderQuestionType()}
      {isEditing && mappingOptions && onMappingChange && (
        <Select
          value={currentMapping}
          onChange={(e) => onMappingChange(question.id, e.target.value)}
        >
          <option value="none">Ninguno</option>
          <option value="user.name" disabled={nameMapped && currentMapping !== 'user.name'}>Nombre de Usuario</option>
          <option value="user.email" disabled={emailMapped && currentMapping !== 'user.email'}>Correo Electrónico de Usuario</option>
        </Select>
      )}
    </FormGroup>
  );
};

export default Question;