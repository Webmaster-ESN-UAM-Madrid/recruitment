'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { CancelButton } from '@/app/components/buttons/CancelButton';
import FormPreview from '@/app/components/FormPreview';
import styled from 'styled-components';
import { useToast } from '@/app/components/toasts/ToastContext';

interface ConnectedForm {
  _id: string;
  formIdentifier: string;
  canCreateUsers: boolean;
  structure: string;
  fieldMappings: { [key: string]: string }; // Change to object type
}

interface FormPreviewModalProps {
  open: boolean;
  onClose: () => void;
  form: ConnectedForm | null;
}

const ModalContent = styled.div`
  padding: 20px;
`;

const FormPreviewModal: React.FC<FormPreviewModalProps> = ({ open, onClose, form }) => {
  const { addToast } = useToast();

  if (!form) return null;

  // Convert fieldMappings from plain object to Map
  const initialMappingsMap = new Map(Object.entries(form.fieldMappings || {}));

  const handleSaveMappings = async (mappings: Map<string, string>) => {
    try {
      const response = await fetch(`/api/forms/${form._id}/map`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldMappings: Object.fromEntries(mappings) }),
      });

      if (response.ok) {
        addToast('Formulario actualizado correctamente', 'success');
        onClose(); // Close the modal after successful save
      } else {
        addToast('No se pudo actualizar el formulario', 'error');
      }
    } catch (e) {
      addToast(`Error al actualizar el formulario: ${(e as Error).message}`, 'error');
    }
  };

  const handleCancelEdit = () => {
    onClose(); // Just close the modal on cancel
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Previsualización del Formulario: {form.formIdentifier}
        <CancelButton
          onClick={onClose}
          ariaLabel="Cerrar"
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        />
      </DialogTitle>
      <DialogContent dividers>
        <ModalContent>
          <FormPreview
            formStructure={form.structure}
            responses={new Map()}
            isEditing={true}
            initialMappings={initialMappingsMap}
            onSaveMappings={handleSaveMappings}
            onCancelEdit={handleCancelEdit}
          />
        </ModalContent>
      </DialogContent>
    </Dialog>
  );
};

export default FormPreviewModal;