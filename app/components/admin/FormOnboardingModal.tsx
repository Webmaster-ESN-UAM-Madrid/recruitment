'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { CancelButton } from '@/app/components/buttons/CancelButton';
import GoogleFormsConnect from './GoogleFormsConnect'; // Import the GoogleFormsConnect component
import styled from 'styled-components';

interface FormOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onFormConnected: () => void;
}

const ModalContent = styled.div`
  padding: 20px;
`;

const FormOnboardingModal: React.FC<FormOnboardingModalProps> = ({ open, onClose, onFormConnected }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Añadir Nuevo Formulario
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
          <GoogleFormsConnect onClose={onClose} onFormConnected={onFormConnected} />
        </ModalContent>
      </DialogContent>
    </Dialog>
  );
};

export default FormOnboardingModal;