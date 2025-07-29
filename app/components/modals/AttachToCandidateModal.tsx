'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from '@/app/components/modals/Modal';
import LoadingSpinner from '@/app/components/loaders/LoadingSpinner';
import { AcceptButton } from '../buttons/AcceptButton';
import { ICandidate } from '@/lib/models/candidate';
import { CancelButton } from '../buttons/CancelButton';

const CandidateGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
  max-height: 300px;
  overflow-y: auto;
`;

const CandidateCard = styled.div<{
  isselected: boolean
}>`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border: 1px solid var(--border-primary);
    border-radius: 16px;
    background-color: var(--bg-primary);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    transition: box-shadow 0.3s ease, background-color 0.3s ease;
    width: fit-content;
    cursor: pointer;

    &:hover {
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    ${({ isselected }) => isselected && `
        background-color: var(--brand-primary);
        color: white;
    `}
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

interface AttachToCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (candidateId: string) => void;
}

const AttachToCandidateModal: React.FC<AttachToCandidateModalProps> = ({ isOpen, onClose, onAttach }) => {
  const [candidates, setCandidates] = useState<ICandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const defaultAvatar = '/default-avatar.jpg';

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/candidates')
        .then(res => res.json())
        .then(data => {
          setCandidates(data.candidates);
          setLoading(false);
        });
    }
  }, [isOpen]);

  const handleAttach = async () => {
    if (selectedCandidate) {
      await onAttach(selectedCandidate);
    }
  };

  const handleSelect = (candidateId: string) => {
    if (selectedCandidate === candidateId) {
      setSelectedCandidate(null);
    } else {
      setSelectedCandidate(candidateId);
    }
  }

  return (
    <Modal isOpen={isOpen} title="Vincular a Candidato">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <CandidateGrid>
          {candidates.map((candidate: ICandidate) => (
            <CandidateCard key={candidate._id} onClick={() => handleSelect(candidate._id)} isselected={selectedCandidate === candidate._id}>
              <Avatar src={candidate.photoUrl || defaultAvatar} onError={(e) => (e.currentTarget.src = defaultAvatar)} />
              {candidate.name}
            </CandidateCard>
          ))}
        </CandidateGrid>
      )}
      <ButtonContainer>
        <AcceptButton onClick={handleAttach} disabled={!selectedCandidate} showSpinner={true}></AcceptButton>
        <CancelButton onClick={onClose}></CancelButton>
      </ButtonContainer>
    </Modal>
  );
};

export default AttachToCandidateModal;