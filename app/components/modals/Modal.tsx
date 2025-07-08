import React from 'react';
import styled from 'styled-components';
import { Dialog, DialogTitle, DialogContent, Breakpoint } from '@mui/material';
import { CancelButton } from '@/app/components/buttons/CancelButton';

const ModalContent = styled.div`
  padding: 20px;
`;

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  title?: string;
  width?: Breakpoint;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, width = 'md' }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth={width} fullWidth>
      <DialogTitle>
        {title}
        {onClose && (
          <CancelButton
            onClick={onClose}
            ariaLabel="Cerrar"
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          />
        )}
      </DialogTitle>
      <DialogContent dividers>
        <ModalContent>
          {children}
        </ModalContent>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;