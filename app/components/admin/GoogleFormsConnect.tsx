/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react';
import FormPreview, { FormSection } from './FormPreview';
import { config } from '@/lib/config';
import { IForm } from '@/lib/models/form';

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

const GoogleFormsConnect = () => {
  const [step, setStep] = useState(0); // Step 0 for form list, 1-4 for connection process
  const [key, setKey] = useState<string | null>(null);
  const [code, setCode] = useState(Array(6).fill(''));
  const [message, setMessage] = useState<string>('');
  const [formId, setFormId] = useState<string | null>(null);
  const [formStructure, setFormStructure] = useState<FormSection[] | null>(null);
  const [connectedForms, setConnectedForms] = useState<IForm[]>([]);
  const [formIdentifier, setFormIdentifier] = useState<string>('');
  const [canCreateUsers, setCanCreateUsers] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const getAppsScript = () => {
    return `function validateForm() {
      const form = FormApp.getActiveForm();
      if (!form) {
        Logger.log("No active form found.");
        return;
      }
        
      const formData = extractFormData(form);
        
      if (!isTriggerRegistered("onFormSubmit")) {
        Logger.log("You must register a trigger for 'onFormSubmit' before proceeding.");
        return;
      }
        
      try {
        const code = generateCode();
        const appsScriptId = ScriptApp.getScriptId();
        const payload = JSON.stringify({ code, formData, key: "${key}", appsScriptId });
        sendPostRequest("register", payload);
        Logger.log('Your code is ' + code);
      } catch (error) {
        Logger.log('Error: ' + error.toString());
      }
    }

    function onFormSubmit(e) {
      if (!e || !e.response) {
        Logger.log("Invalid form submission event.");
        return;
      }
      
      const formResponse = e.response;
      const responses = extractResponses(formResponse);
      
      try {
        const payload = JSON.stringify({ respondentEmail: formResponse.getRespondentEmail(), responses, appsScriptId: ScriptApp.getScriptId() });
        sendPostRequest("response", payload);
      } catch (error) {
        Logger.log('Error: ' + error.toString());
      }
    }

    function extractFormData(form) {
      const items = form.getItems();
      const formData = [[form.getTitle(), []]];
      
      items.forEach((item) => {
        const type = item.getType().toString();
        if (type === "SECTION_HEADER") return;

        if (type === "PAGE_BREAK") {
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
        MULTIPLE_CHOICE: "asMultipleChoiceItem",
        CHECKBOX: "asCheckboxItem",
        LIST: "asListItem",
        GRID: "asGridItem",
        CHECKBOX_GRID: "asCheckboxGridItem",
        TIME: "asTimeItem",
        DATE: "asDateItem",
        DATETIME: "asDateTimeItem",
        SCALE: "asScaleItem",
        RATING: "asRatingItem",
        TEXT: "asTextItem",
        PARAGRAPH_TEXT: "asParagraphTextItem",
        DURATION: "asDurationItem",
      };

      if (!typeMapping[type]) return null;

      const question = { id: item.getId(), title: item.getTitle(), description: item.getHelpText(), type };
      const itemFunction = typeMapping[type];

      switch (type) {
        case "MULTIPLE_CHOICE":
        case "CHECKBOX":
        case "LIST": {
          const specificItem = item[itemFunction]();
          question.options = specificItem.getChoices().map((choice) => choice.getValue());
          question.required = specificItem.isRequired();
          break;
        }
        case "GRID":
        case "CHECKBOX_GRID": {
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
      return Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
    }

    function sendPostRequest(action, payload) {
      UrlFetchApp.fetch('${config.baseURL}/api/forms/connect/' + action, {
        method: "POST",
        contentType: "application/json",
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
      setFormStructure(JSON.parse(structure) as FormSection[]);
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

  const formIdentifierSuggestions = connectedForms.map(form => form.formIdentifier).filter(Boolean) as string[];

  if (step === 0) {
    return (
      <div>
        <h2>Connected Forms</h2>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button onClick={startNewConnection}>Connect New Form</button>
        <div style={{ marginTop: '20px' }}>
          {connectedForms.length === 0 ? (
            <p>No forms connected yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {connectedForms.map((form) => (
                <li key={form._id as string} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                  <p><strong>ID:</strong> {form._id as string}</p>
                  <p><strong>Identifier:</strong> {form.formIdentifier || 'N/A'}</p>
                  <p><strong>Provider:</strong> {form.provider}</p>
                  <p><strong>Can Create Users:</strong> {form.canCreateUsers ? 'Yes' : 'No'}</p>
                  <button onClick={() => handleDeleteForm(form._id as string)}>Delete</button>
                  <button onClick={() => handleReplaceForm(form as ConnectedForm)} style={{ marginLeft: '10px' }}>Replace</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {step === 1 && (
        <div>
          <h2>Step 1: Go to Script Editor</h2>
          <p>Go to the form you want to connect, click on the three dots (⋮) and go to "Script editor".</p>
          <button onClick={() => setStep(2)}>Next</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Step 2: Paste the Code</h2>
          <p>Copy this code and paste it into the script editor (replace the current code). Make sure to save the file.</p>
          <pre>{getAppsScript()}</pre>
          <button onClick={() => setStep(1)}>Back</button>
          <button onClick={() => setStep(3)}>Next</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Step 3: Validate</h2>
          <p>Go to the triggers tab and add a trigger for the "onFormSubmit" function with "On form submit" as the event type.</p>
          <p>Then, go back to the code tab, select "validateForm" and run the function.</p>
          <p>Enter the 6-digit code from the console here:</p>
          <div>
            <label htmlFor="formIdentifier">Form Identifier (Optional, for replacing existing forms):</label>
            <input
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
          <div>
            <input
              id="canCreateUsers"
              type="checkbox"
              checked={canCreateUsers}
              onChange={(e) => setCanCreateUsers(e.target.checked)}
            />
            <label htmlFor="canCreateUsers">This form can create new users</label>
          </div>
          <div>
            {code.map((digit, index) => (
              <input
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
          <button onClick={() => setStep(2)}>Back</button>
          <button onClick={submitCode}>Submit</button>
        </div>
      )}

      {step === 4 && formStructure && formId && (
        <FormPreview formStructure={formStructure} formId={formId} />
      )}
    </div>
  );
};

export default GoogleFormsConnect;
