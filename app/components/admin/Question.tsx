interface QuestionType {
  id: string;
  title: string;
  type: string;
  options?: string[];
  rows?: string[];
  columns?: string[];
}

interface QuestionProps {
  question: QuestionType;
  onMappingChange: (questionId: string, fieldType: string) => void;
}

const Question = ({ question, onMappingChange }: QuestionProps) => {
  const renderQuestionType = () => {
    switch (question.type) {
      case 'TEXT':
      case 'PARAGRAPH_TEXT':
        return <input type="text" disabled />;
      case 'DATE':
        return <input type="date" disabled />;
      case 'MULTIPLE_CHOICE':
        return (
          <div>
            {question.options?.map(option => (
              <div key={option}>
                <input type="radio" disabled />
                <label>{option}</label>
              </div>
            ))}
          </div>
        );
      case 'CHECKBOX':
        return (
          <div>
            {question.options?.map(option => (
              <div key={option}>
                <input type="checkbox" disabled />
                <label>{option}</label>
              </div>
            ))}
          </div>
        );
      case 'LIST':
        return (
          <select disabled>
            {question.options?.map(option => (
              <option key={option}>{option}</option>
            ))}
          </select>
        );
      case 'GRID':
        return (
          <table>
            <tbody>
              {question.rows?.map(row => (
                <tr key={row}>
                  <td>{row}</td>
                  {question.columns?.map(col => (
                    <td key={col}>
                      <input type="radio" disabled />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'CHECKBOX_GRID':
        return (
          <table>
            <tbody>
              {question.rows?.map(row => (
                <tr key={row}>
                  <td>{row}</td>
                  {question.columns?.map(col => (
                    <td key={col}>
                      <input type="checkbox" disabled />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      default:
        return <p>Unsupported question type: {question.type}</p>;
    }
  };

  return (
    <div>
      <h4>{question.title}</h4>
      {renderQuestionType()}
      <select onChange={(e) => onMappingChange(question.id, e.target.value)}>
        <option value="">None</option>
        <option value="user.email">User Email</option>
        <option value="user.name">User Name</option>
        {/* Add other mapping options here */}
      </select>
    </div>
  );
};

export default Question;