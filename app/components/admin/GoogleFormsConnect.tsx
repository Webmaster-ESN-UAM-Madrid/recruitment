/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react';
import FormPreview from '../FormPreview';
import { config } from '@/lib/config';
import styled from 'styled-components';
import { CopyButton } from "@/app/components/buttons/CopyButton";
import { useToast } from '@/app/components/toasts/ToastContext';
import { BackButton } from '../buttons/BackButton';
import { NextButton } from '../buttons/NextButton';
import { SaveButton } from '../buttons/SaveButton';

type FormSection = [string, any[]];

const Container = styled.div`
  background-color: #ffffff;
  border-radius: var(--border-radius-md);
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
  font-family: 'Montserrat', sans-serif;
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

const CodeWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const FloatingCopyButton = styled.div`
  position: absolute;
  top: 8px;
  right: 24px;
  z-index: 1;
`;

const CodeBlock = styled.pre`
  background: #f5f5f5;
  border: none;
  cursor: pointer;
  padding: 12px;
  display: flex;
  user-select: all;
  height: 200px;
  overflow: auto;
  border-radius: var(--border-radius-md);

  svg {
    width: 20px;
    height: 20px;
    fill: #616364;
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: scale(1.1);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

interface GoogleFormsConnectProps {
  onClose: () => void;
  onFormConnected: () => void;
}

const GoogleFormsConnect = ({ onClose, onFormConnected }: GoogleFormsConnectProps) => {
  const [step, setStep] = useState(1);
  const [key, setKey] = useState<string | null>(null);
  const [code, setCode] = useState(Array(6).fill(''));
  const [formId, setFormId] = useState<string | null>(null);
  const [formStructure, setFormStructure] = useState<FormSection[] | null>(null);
  const [formIdentifier, setFormIdentifier] = useState<string>('');
  const [canCreateUsers, setCanCreateUsers] = useState<boolean>(false);

  const { addToast } = useToast();

  const getAppsScript = () => {
    return `function validateForm() {
      const form = FormApp.getActiveForm();
      if (!form) {
        Logger.log('No se ha encontrado un form activo.');
        return;
      }
        
      const formData = extractFormData(form);
        
      if (!isTriggerRegistered('onFormSubmit')) {
        Logger.log('Tienes que registrar un activador para \`onFormSubmit\` antes de seguir.');
        return;
      }
        
      try {
        const code = generateCode();
        const appsScriptId = ScriptApp.getScriptId();
        const payload = JSON.stringify({ code, formData, key: '${key}', appsScriptId });
        sendPostRequest('register', payload);
        Logger.log(\`Tu código es \` + code);
      } catch (error) {
        Logger.log(\`Error: \` + error.toString());
      }
    }

    function onFormSubmit(e) {
      if (!e || !e.response) {
        Logger.log('Evento de respuesta al formulario inválido.');
        return;
      }
      
      const formResponse = e.response;
      const responses = extractResponses(formResponse);
      
      try {
        const payload = JSON.stringify({ respondentEmail: formResponse.getRespondentEmail(), responses, appsScriptId: ScriptApp.getScriptId() });
        sendPostRequest('response', payload);
      } catch (error) {
        Logger.log(\`Error: \` + error.toString());
      }
    }

    function extractFormData(form) {
      const items = form.getItems();
      const formData = [[form.getTitle(), []]];
      
      items.forEach((item) => {
        const type = item.getType().toString();
        if (type === 'SECTION_HEADER') return;

        if (type === 'PAGE_BREAK') {
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
        MULTIPLE_CHOICE: 'asMultipleChoiceItem',
        CHECKBOX: 'asCheckboxItem',
        LIST: 'asListItem',
        GRID: 'asGridItem',
        CHECKBOX_GRID: 'asCheckboxGridItem',
        TIME: 'asTimeItem',
        DATE: 'asDateItem',
        DATETIME: 'asDateTimeItem',
        SCALE: 'asScaleItem',
        RATING: 'asRatingItem',
        TEXT: 'asTextItem',
        PARAGRAPH_TEXT: 'asParagraphTextItem',
        DURATION: 'asDurationItem',
      };

      if (!typeMapping[type]) return null;

      const question = { id: item.getId(), title: item.getTitle(), description: item.getHelpText(), type };
      const itemFunction = typeMapping[type];

      switch (type) {
        case 'MULTIPLE_CHOICE':
        case 'CHECKBOX':
        case 'LIST': {
          const specificItem = item[itemFunction]();
          question.options = specificItem.getChoices().map((choice) => choice.getValue());
          question.required = specificItem.isRequired();
          break;
        }
        case 'GRID':
        case 'CHECKBOX_GRID': {
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
      return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    }

    function sendPostRequest(action, payload) {
      UrlFetchApp.fetch(\`${config.baseURL}/api/forms/connect/\` + action, {
        method: 'POST',
        contentType: 'application/json',
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
    const response = await fetch('/api/forms/connect/init', { method: 'POST' });
    const data = await response.json();
    setKey(data.key);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const inputValue = e.target.value;
    const prevValue = code[index];
    let newChar = '';

    if (inputValue.length === 1) {
      newChar = inputValue;
    } else if (inputValue.length > 1) {
      const addedChar = [...inputValue].find(char => !prevValue.includes(char));
      newChar = addedChar || inputValue.slice(-1);
    }

    const newCode = [...code];
    newCode[index] = newChar;
    setCode(newCode);

    if (newChar && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        e.preventDefault();
        prevInput.focus();
        prevInput.select();
      }
    } else if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        e.preventDefault();
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        prevInput.focus();
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
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
      addToast('Formulario conectado correctamente', 'success');
      onFormConnected();
    } else {
      addToast('Error al validar el código', 'error');
    }
  };

  const handleSaveMappings = async (mappings: Map<string, string>) => {
    try {
      const response = await fetch(`/api/forms/${formId}/map`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldMappings: Object.fromEntries(mappings) }),
      });

      if (response.ok) {
        addToast('Formulario actualizado correctamente', 'success');
        onClose();
      } else {
        addToast('Error al actualizar el formulario', 'error');
      }
    } catch (e) {
      addToast(`Error al actuializar el formulario: ${(e as Error).message}`, 'error');
    }
  };

  const handleCancelEdit = () => {
    onClose();
  };

  return (
    <Container>
      {step === 1 && (
      <div>
        <Title>Paso 1: Ve al Editor de Scripts</Title>
        <p>Ve al formulario que quieres conectar, haz clic en los tres puntos (⋮) y selecciona "Editor de secuencias de comandos" o "Apps Script".</p>
        <ButtonContainer>
          <BackButton onClick={() => {}} disabled={true}></BackButton>
          <NextButton onClick={() => setStep(2)}></NextButton>
        </ButtonContainer>
      </div>
      )}

      {step === 2 && (
      <div>
        <Title>Paso 2: Pega el Código</Title>
        <p>
          Copia este código y pégalo en el editor de secuencias de comandos (reemplaza el código actual). Asegúrate de guardar el archivo.
        </p>
        <br />
        <CodeWrapper>
          <FloatingCopyButton>
            <CopyButton content={getAppsScript()} iconSize={20} />
          </FloatingCopyButton>
          <CodeBlock>{getAppsScript()}</CodeBlock>
        </CodeWrapper>
        <ButtonContainer>
          <BackButton onClick={() => setStep(1)}></BackButton>
          <NextButton onClick={() => setStep(3)}></NextButton>
        </ButtonContainer>
      </div>
      )}

      {step === 3 && (
      <div>
        <Title>Paso 3: Validar</Title>
        <p>Ve a la pestaña de activadores y añade un activador para la función "onFormSubmit" con el tipo de evento "Al enviar formulario".</p>
        <br />
        <p>Luego, vuelve a la pestaña de código, selecciona "validateForm" y ejecuta la función.</p>
        <br />
        <div>
        <StyledLabel htmlFor="formIdentifier">Identificador del formulario (Opcional, para reemplazar formularios existentes):</StyledLabel>
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
          <StyledLabel htmlFor="canCreateUsers">Este formulario puede crear nuevos usuarios</StyledLabel>
        </StyledCheckboxContainer>
        <p>Introduce aquí el código de 6 dígitos que aparece en la consola:</p>
        <div>
        {code.map((digit, index) => (
          <CodeInput
            key={index}
            id={`code-${index}`}
            type="text"
            value={digit}
            onChange={(e) => handleCodeChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={handleFocus}
          />
        ))}
        </div>
        <ButtonContainer>
          <BackButton onClick={() => setStep(2)}></BackButton>
          <SaveButton onClick={submitCode}></SaveButton>
        </ButtonContainer>
      </div>
      )}

      {step === 4 && formStructure && formId && (
      <FormPreview
        formStructure={formStructure as any}
        responses={new Map()}
        isEditing={true} 
        onSaveMappings={handleSaveMappings}
        onCancelEdit={handleCancelEdit} />
      )}
    </Container>
  );
};

export default GoogleFormsConnect;