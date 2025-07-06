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
  margin-top: 20px;

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
  const [step, setStep] = useState(1); // Start directly at step 1 for connection process
  const [key, setKey] = useState<string | null>(null);
  const [code, setCode] = useState(Array(6).fill(''));
  const [message, setMessage] = useState<string>('');
  const [formId, setFormId] = useState<string | null>(null);
  const [formStructure, setFormStructure] = useState<FormSection[] | null>(null); // Updated type
  const [formIdentifier, setFormIdentifier] = useState<string>('');
  const [canCreateUsers, setCanCreateUsers] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

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

  useEffect(() => {
    startNewConnection();
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
    } else {
      setError(data.message);
    }
  };

  return (
    <Container>
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
            />
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