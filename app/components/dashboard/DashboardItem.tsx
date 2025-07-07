
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { ReadButton } from '../buttons/ReadButton';
import Modal from '../modals/Modal';
import Tooltip from '@mui/material/Tooltip';

const ItemContainer = styled.div<{ $isOverflowing: boolean }>`
  padding: 0 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  ${props => props.$isOverflowing && `
    text-decoration: underline dotted;
    cursor: help;
  `}
`;

interface Candidate {
  _id: string;
  name: string;
  email: string;
  photoUrl?: string;
  active: boolean;
  alternateEmails?: string[]; // Optional property for alternate emails
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formResponses?: any[]; // Add formResponses property
}

interface DashboardItemProps {
  candidate: Candidate;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  columnKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formResponses?: any[];
  gridTemplateColumns?: string; // Add this prop
}

const DashboardItem: React.FC<DashboardItemProps> = ({ candidate, data, columnKey, formResponses, gridTemplateColumns }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkOverflow = () => {
    if (textRef.current) {
      setIsOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  };

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [data, formResponses, gridTemplateColumns]);

  const isFormQuestion = !isNaN(Number(columnKey));

  let displayValue: string;

  if (isFormQuestion && formResponses) {
    const formResponse = formResponses.find(response => response.responses && response.responses[columnKey] !== undefined);
    displayValue = formResponse && formResponse.responses[columnKey] !== undefined ? formResponse.responses[columnKey] : "N/A";
  } else if (columnKey === 'email') {
    if (candidate?.alternateEmails && candidate.alternateEmails.length > 0) {
      displayValue = `${candidate.email} (Otros emails: ${candidate.alternateEmails.join(', ')})`;
    } else {
      displayValue = candidate.email;
    }
  } else {
    displayValue = typeof data === 'object' ? JSON.stringify(data) : data;
  }

  const content = (
    <ItemContainer ref={textRef} $isOverflowing={isOverflowing}>
      {displayValue}
    </ItemContainer>
  );

  if (columnKey === 'feedback') {
    return (
      <ItemContainer $isOverflowing={false}>
        <ReadButton onClick={() => setIsModalOpen(true)} iconSize={20} />
        <Modal
          title={`Feedback de ${candidate?.name || '[Candidato]'}`}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          <p>Lorem ipsum dolor sit amet eu ullamcorper mattis justo. Conubia dis nam himenaeos convallis pharetra habitasse senectus eros augue dolor. Nibh pharetra fames luctus sapien risus donec lacinia felis. Mollis augue habitasse blandit fringilla rhoncus faucibus. Ligula arcu pede vel vitae adipiscing eget. Viverra dolor morbi rhoncus penatibus aliquet litora. Odio sagittis congue tempus augue donec semper.</p>
          <br />
          <p>Ut phasellus posuere at inceptos habitasse nec quisque velit. Tempus arcu interdum porta pretium consequat risus molestie ligula. Inceptos vestibulum porttitor tempor penatibus sollicitudin augue tempus parturient. Adipiscing aptent condimentum cursus diam vitae hac.</p>
        </Modal>
      </ItemContainer>
    );
  }

  return (
    isOverflowing ? (
      <Tooltip
        title={displayValue}
        arrow
        slotProps={{
          tooltip: {
            sx: {
              fontSize: '1rem', // Adjust as needed
            },
          },
        }}
      >
        {content}
      </Tooltip>
    ) : (
      content
    )
  );
};

export default DashboardItem;
