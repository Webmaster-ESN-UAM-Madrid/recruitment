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
}

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
`;

const Description = styled.p`
  font-size: 0.9em;
  color: #666;
  margin-bottom: 10px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #e9e9e9; /* Make it look disabled */
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #e9e9e9;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #e9e9e9;
  min-height: 80px;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }

  th {
    background-color: #f2f2f2;
  }
`;

const Question = ({ question, responseValue }: QuestionProps) => {
  const renderQuestionType = () => {
    const displayValue = responseValue !== null && responseValue !== undefined && responseValue !== '' ? String(responseValue) : 'N/A';

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
        return <p>Unsupported question type: {question.type}</p>;
    }
  };

  return (
    <FormGroup>
      <Label>{question.title}{question.required && " *"}</Label>
      {question.description && <Description>{question.description}</Description>}
      {renderQuestionType()}
    </FormGroup>
  );
};

export default Question;