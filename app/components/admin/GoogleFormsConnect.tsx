/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react';
import FormPreview from '../FormPreview';
import { config } from '@/lib/config';
import { IForm } from '@/lib/models/form';
import styled from 'styled-components';

interface ConnectedForm {
  _id: string;
  provider: string;
  appsScriptId?: string;
  structure: string;
  fieldMappings: Map<string, string>;
  canCreateUsers: boolean;
  formIdentifier?: string;
  recruitmentProcessId?: string;
}

// This represents a section: [sectionTitle: string, fields: FormField[]]
type FormSection = [string, any[]]; // Using any[] for fields for now to avoid circular dependency issues

const Container = styled.div`
  background-color: #ffffff;
  border-radius: var(--border-radius-md);
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
  font-family: 'Montserrat', sans-serif;
`;

const StyledButton = styled.button`
  background-color: var(--main-color); /* Primary button color */
  color: white;
  border: none;
  border-radius: var(--border-radius-md); /* Rounded corners for buttons */
  padding: 10px 20px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
  margin-right: 10px;

  &:hover {
    background-color: #0056b3; /* Darker variant of main color */
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(StyledButton)`
  background-color: #6c757d; /* Secondary button color */

  &:hover {
    background-color: #5a6268;
  }
`;

const CodeInput = styled.input`
  width: 40px;
  height: 40px;
  text-align: center;
  font-size: 1.2em;
  margin: 0 5px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius-md);
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 10px;
  margin-top: 5px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius-md);
`;

const StyledCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

const StyledCheckbox = styled.input`
  margin-right: 10px;
`;

const StyledLabel = styled.label`
  font-family: 'Inter', sans-serif;
`;

const FormList = styled.ul`
  list-style: none;
  padding: 0;
`;

const FormListItem = styled.li`
  border: 1px solid #eee;
  border-radius: var(--border-radius-md);
  padding: 15px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  p {
    margin-bottom: 5px;
    font-family: 'Inter', sans-serif;
  }

  strong {
    font-weight: 600;
  }
`;

const CodeBlock = styled.pre`
  background-color: #eef;
  border: 1px solid #ddd;
  border-radius: var(--border-radius-md);
  padding: 15px;
  overflow-x: auto;
  font-family: 'Fira Code', 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
  line-height: 1.4;
  color: #333;
`;

const GoogleFormsConnect = () => {
  const [step, setStep] = useState(0); // Step 0 for form list, 1-4 for connection process
  const [key, setKey] = useState<string | null>(null);
  const [code, setCode] = useState(Array(6).fill(''));
  const [message, setMessage] = useState<string>('');
  const [formId, setFormId] = useState<string | null>(null);
  const [formStructure, setFormStructure] = useState<FormSection[] | null>(null); // Updated type
  const [connectedForms, setConnectedForms] = useState<IForm[]>([]);
  const [formIdentifier, setFormIdentifier] = useState<string>('');
  const [canCreateUsers, setCanCreateUsers] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [editingForm, setEditingForm] = useState<IForm | null>(null); // New state for editing

  const getAppsScript = () => {
    return `function validateForm() {
      const form = FormApp.getActiveForm();
      if (!form) {
        Logger.log(&quot;No active form found.&quot;);
        return;
      }
        
      const formData = extractFormData(form);
        
      if (!isTriggerRegistered(&quot;onFormSubmit&quot;)) {
        Logger.log(&quot;You must register a trigger for &#39;onFormSubmit&#39; before proceeding.&quot;);
        return;
      }
        
      try {
        const code = generateCode();
        const appsScriptId = ScriptApp.getScriptId();
        const payload = JSON.stringify({ code, formData, key: &quot;${key}&quot;, appsScriptId });
        sendPostRequest(&quot;register&quot;, payload);
        Logger.log(&#39;Your code is &#39; + code);
      } catch (error) {
        Logger.log(&#39;Error: &#39; + error.toString());
      }
    }

    function onFormSubmit(e) {
      if (!e || !e.response) {
        Logger.log(&quot;Invalid form submission event.&quot;);
        return;
      }
      
      const formResponse = e.response;
      const responses = extractResponses(formResponse);
      
      try {
        const payload = JSON.stringify({ respondentEmail: formResponse.getRespondentEmail(), responses, appsScriptId: ScriptApp.getScriptId() });
        sendPostRequest(&quot;response&quot;, payload);
      } catch (error) {
        Logger.log(&#39;Error: &#39; + error.toString());
      }
    }

    function extractFormData(form) {
      const items = form.getItems();
      const formData = [[form.getTitle(), []]];
      
      items.forEach((item) => {
        const type = item.getType().toString();
        if (type === &quot;SECTION_HEADER&quot;) return;

        if (type === &quot;PAGE_BREAK&quot;) {
          formData.push([item.getTitle(), []]);
          return;
        }

        const question = buildQuestion(item, type);
        if (question) formData[formData.length - 1][1].push(question);
      });
      
      return formData;
    }

    function buildQuestion(item, type) {
      const typeMapping = {
        MULTIPLE_CHOICE: &quot;asMultipleChoiceItem&quot;,
        CHECKBOX: &quot;asCheckboxItem&quot;,
        LIST: &quot;asListItem&quot;,
        GRID: &quot;asGridItem&quot;,
        CHECKBOX_GRID: &quot;asCheckboxGridItem&quot;,
        TIME: &quot;asTimeItem&quot;,
        DATE: &quot;asDateItem&quot;,
        DATETIME: &quot;asDateTimeItem&quot;,
        SCALE: &quot;asScaleItem&quot;,
        RATING: &quot;asRatingItem&quot;,
        TEXT: &quot;asTextItem&quot;,
        PARAGRAPH_TEXT: &quot;asParagraphTextItem&quot;,
        DURATION: &quot;asDurationItem&quot;,
      };

      if (!typeMapping[type]) return null;

      const question = { id: item.getId(), title: item.getTitle(), description: item.getHelpText(), type };
      const itemFunction = typeMapping[type];

      switch (type) {
        case &quot;MULTIPLE_CHOICE&quot;:
        case &quot;CHECKBOX&quot;:
        case &quot;LIST&quot;: {
          const specificItem = item[itemFunction]();
          question.options = specificItem.getChoices().map((choice) => choice.getValue());
          question.required = specificItem.isRequired();
          break;
        }
        case &quot;GRID&quot;:
        case &quot;CHECKBOX_GRID&quot;: {
          const specificItem = item[itemFunction]();
          question.rows = specificItem.getRows();
          question.columns = specificItem.getColumns();
          question.required = specificItem.isRequired();
          break;
        }
        default: {
          const specificItem = item[itemFunction]();
          question.required = specificItem.isRequired();
          break;
        }
      }

      return question;
    }

    function extractResponses(formResponse) {
      return formResponse.getItemResponses().map((itemResponse) => {
        const item = itemResponse.getItem();
        return {
          id: item.getId(),
          value: itemResponse.getResponse(),
        };
      });
    }

    function isTriggerRegistered(handlerFunction) {
      return ScriptApp.getProjectTriggers().some((trigger) =>
        trigger.getHandlerFunction() === handlerFunction &&
        trigger.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT &&
        trigger.getTriggerSource() === ScriptApp.TriggerSource.FORMS
      );
    }

    function generateCode() {
      return Math.floor(Math.random() * 1000000).toString().padStart(6, &quot;0&quot;);
    }

    function sendPostRequest(action, payload) {
      UrlFetchApp.fetch(&#39;${config.baseURL}/api/forms/connect/&#39; + action, {
        method: &quot;POST&quot;,
        contentType: &quot;application/json&quot;,
        payload
      });
    }`;
  };

  const fetchConnectedForms = async () => {
    try {
      const response = await fetch('/api/forms');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setConnectedForms(data);
    } catch (e) {
      setError(`Failed to fetch connected forms: ${(e as Error).message}`);
    }
  };

  useEffect(() => {
    fetchConnectedForms();
  }, []);

  const startNewConnection = async () => {
    setStep(1);
    setFormIdentifier('');
    setCanCreateUsers(false);
    setError('');
    setMessage('');
    const response = await fetch('/api/forms/connect/init', { method: 'POST' });
    const data = await response.json();
    setKey(data.key);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newCode = [...code];
    newCode[index] = e.target.value;
    setCode(newCode);

    if (e.target.value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const submitCode = async () => {
    const response = await fetch('/api/forms/connect/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, code: code.join(''), formIdentifier, canCreateUsers }),
    });

    const data = await response.json();

    if (response.ok) {
      setFormId(data.formId);
      const structure = await fetch(`/api/forms/${data.formId}`)
        .then(res => res.json())
        .then(data => data.structure);
      setFormStructure(structure);
      setStep(4);
      fetchConnectedForms(); // Refresh list after successful connection
    } else {
      setError(data.message);
    }
  };

  const handleDeleteForm = async (id: string) => {
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        fetchConnectedForms(); // Refresh list
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError(`Failed to delete form: ${(e as Error).message}`);
    }
  };

  const handleReplaceForm = (form: ConnectedForm) => {
    setFormIdentifier(form.formIdentifier || '');
    setCanCreateUsers(form.canCreateUsers);
    startNewConnection(); // Start the connection process with pre-filled data
  };

  const handleEditForm = (form: IForm) => {
    // Convert fieldMappings from plain object to Map if it's not already a Map
    const fieldMappingsMap = form.fieldMappings instanceof Map 
      ? form.fieldMappings 
      : new Map(Object.entries(form.fieldMappings || {}).map(([key, value]) => [key, String(value)]));
    
    // Directly modify the form object's fieldMappings and then set it as the editingForm
    form.fieldMappings = fieldMappingsMap;
    setEditingForm(form);
  };

  const handleSaveMappings = async (mappings: Map<string, string>) => {
    if (!editingForm) return;

    try {
      const response = await fetch(`/api/forms/${editingForm._id}/map`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldMappings: Object.fromEntries(mappings) }), // Convert Map to object for JSON
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Mappings updated successfully!');
        setEditingForm(null); // Exit editing mode
        fetchConnectedForms(); // Refresh list
      } else {
        setError(data.message || 'Failed to update mappings.');
      }
    } catch (e) {
      setError(`Failed to save mappings: ${(e as Error).message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingForm(null); // Exit editing mode
  };

  const formIdentifierSuggestions = connectedForms.map(form => form.formIdentifier).filter(Boolean) as string[];

  if (editingForm) {
    return (
      <Container>
        <Title>Edit Form Mappings: {editingForm.formIdentifier || editingForm._id as string}</Title>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <FormPreview
          formStructure={editingForm.structure}
          responses={new Map()}
          isEditing={true}
          initialMappings={editingForm.fieldMappings}
          onSaveMappings={handleSaveMappings}
          onCancelEdit={handleCancelEdit}
        />
      </Container>
    );
  }

  return (
    <Container>
      {step === 0 && (
        <div>
          <Title>Connected Forms</Title>
          {message && <p style={{ color: 'green' }}>{message}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <StyledButton onClick={startNewConnection}>Connect New Form</StyledButton>
          <div style={{ marginTop: '20px' }}>
            {connectedForms.length === 0 ? (
              <p>No forms connected yet.</p>
            ) : (
              <FormList>
                {connectedForms.map((form) => (
                  <FormListItem key={form._id as string}>
                    <p><strong>ID:</strong> {form._id as string}</p>
                    <p><strong>Identifier:</strong> {form.formIdentifier || 'N/A'}</p>
                    <p><strong>Provider:</strong> {form.provider}</p>
                    <p><strong>Can Create Users:</strong> {form.canCreateUsers ? 'Yes' : 'No'}</p>
                    <StyledButton onClick={() => handleDeleteForm(form._id as string)}>Delete</StyledButton>
                    <StyledButton onClick={() => handleReplaceForm(form as ConnectedForm)}>Replace</StyledButton>
                    <StyledButton onClick={() => handleEditForm(form)}>Edit</StyledButton>
                  </FormListItem>
                ))}
              </FormList>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <Title>Step 1: Go to Script Editor</Title>
          <p>Go to the form you want to connect, click on the three dots (⋮) and go to "Script editor".</p>
          <StyledButton onClick={() => setStep(2)}>Next</StyledButton>
        </div>
      )}

      {step === 2 && (
        <div>
          <Title>Step 2: Paste the Code</Title>
          <p>Copy this code and paste it into the script editor (replace the current code). Make sure to save the file.</p>
          <CodeBlock>{getAppsScript()}</CodeBlock>
          <CancelButton onClick={() => setStep(1)}>Back</CancelButton>
          <StyledButton onClick={() => setStep(3)}>Next</StyledButton>
        </div>
      )}

      {step === 3 && (
        <div>
          <Title>Step 3: Validate</Title>
          <p>Go to the triggers tab and add a trigger for the "onFormSubmit" function with "On form submit" as the event type.</p>
          <p>Then, go back to the code tab, select "validateForm" and run the function.</p>
          <p>Enter the 6-digit code from the console here:</p>
          <div>
            <StyledLabel htmlFor="formIdentifier">Form Identifier (Optional, for replacing existing forms):</StyledLabel>
            <StyledInput
              id="formIdentifier"
              type="text"
              value={formIdentifier}
              onChange={(e) => setFormIdentifier(e.target.value)}
              list="formIdentifierSuggestions"
            />
            <datalist id="formIdentifierSuggestions">
              {formIdentifierSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>
          <StyledCheckboxContainer>
            <StyledCheckbox
              id="canCreateUsers"
              type="checkbox"
              checked={canCreateUsers}
              onChange={(e) => setCanCreateUsers(e.target.checked)}
            />
            <StyledLabel htmlFor="canCreateUsers">This form can create new users</StyledLabel>
          </StyledCheckboxContainer>
          <div>
            {code.map((digit, index) => (
              <CodeInput
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(e, index)}
              />
            ))}
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <CancelButton onClick={() => setStep(2)}>Back</CancelButton>
          <StyledButton onClick={submitCode}>Submit</StyledButton>
        </div>
      )}

      {step === 4 && formStructure && formId && (
        <FormPreview formStructure={formStructure as any} responses={new Map()} />
      )}
    </Container>
  );
};

export default GoogleFormsConnect;