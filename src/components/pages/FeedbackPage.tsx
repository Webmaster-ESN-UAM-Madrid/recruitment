'use client';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSession } from 'next-auth/react';

const PageContainer = styled.div`
  padding: 20px;
`;

const SectionTitle = styled.h2`
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const CandidateTable = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 5px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 150px 120px;
  padding: 10px 15px;
  background-color: #f0f0f0;
  font-weight: bold;
  border-bottom: 1px solid #ddd;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 150px 120px;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;

  &:hover {
    background-color: #f9f9f9;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const CandidateName = styled.span`
  font-weight: bold;
`;

const DataCell = styled.div`
  padding: 0 10px;
`;

const ActionsCell = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
`;

const AccordionContent = styled.div`
  padding: 15px;
  background-color: #f9f9f9;
`;

const FeedbackItem = styled.div`
  padding: 10px;
  border-bottom: 1px solid #eee;
  &:last-child {
    border-bottom: none;
  }
`;

const EditedIndicator = styled.span`
  font-size: 0.8em;
  color: #888;
  margin-left: 10px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  width: 500px;
`;

const ModalTitle = styled.h3`
  margin-top: 0;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

interface Candidate {
  _id: string;
  name: string;
  photoUrl?: string;
}

interface Feedback {
  _id: string;
  candidateId: string;
  givenBy: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

const FeedbackPage: React.FC = () => {
  const { data: session } = useSession();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const defaultAvatar = '/default-avatar.jpg';

  useEffect(() => {
    const fetchCandidates = async () => {
      const res = await fetch('/api/candidates');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    };

    const fetchFeedback = async () => {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        setFeedback(data);
      }
    };

    fetchCandidates();
    fetchFeedback();
  }, []);

  const handleRowClick = (candidateId: string) => {
    setExpandedRow(expandedRow === candidateId ? null : candidateId);
  };

  const openModal = (candidate: Candidate, feedbackToEdit?: Feedback) => {
    setSelectedCandidate(candidate);
    if (feedbackToEdit) {
      setEditingFeedback(feedbackToEdit);
      setFeedbackText(feedbackToEdit.content);
    } else {
      setEditingFeedback(null);
      setFeedbackText('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedCandidate(null);
    setEditingFeedback(null);
    setIsModalOpen(false);
    setFeedbackText('');
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedCandidate) return;

    const url = editingFeedback
      ? `/api/feedback/${editingFeedback._id}`
      : '/api/feedback';
    const method = editingFeedback ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidateId: selectedCandidate._id,
        feedback: feedbackText,
      }),
    });

    if (res.ok) {
      const updatedFeedback = await res.json();
      if (editingFeedback) {
        setFeedback(
          feedback.map(f => (f._id === editingFeedback._id ? updatedFeedback : f))
        );
      } else {
        setFeedback([...feedback, updatedFeedback]);
      }
      closeModal();
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    const res = await fetch(`/api/feedback/${feedbackId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setFeedback(feedback.filter(f => f._id !== feedbackId));
    }
  };

  return (
    <PageContainer>
      <SectionTitle>Feedback</SectionTitle>
      <CandidateTable>
        <TableHeader>
          <DataCell>Photo</DataCell>
          <DataCell>Name</DataCell>
          <DataCell>Feedback Entries</DataCell>
          <DataCell>Actions</DataCell>
        </TableHeader>
        {candidates.map(candidate => {
          const candidateFeedback = feedback.filter(f => f.candidateId === candidate._id && f.givenBy === session?.user?.id);
          return (
            <div key={candidate._id}>
              <TableRow onClick={() => handleRowClick(candidate._id)}>
                <DataCell>
                  <Avatar src={candidate.photoUrl || defaultAvatar} onError={(e) => (e.currentTarget.src = defaultAvatar)} />
                </DataCell>
                <DataCell>
                  <CandidateName>{candidate.name}</CandidateName>
                </DataCell>
                <DataCell>{candidateFeedback.length}</DataCell>
                <ActionsCell>
                  <Button onClick={() => openModal(candidate)}>Add Feedback</Button>
                </ActionsCell>
              </TableRow>
              {expandedRow === candidate._id && (
                <AccordionContent>
                  {candidateFeedback.length > 0 ? (
                    candidateFeedback.map(f => (
                      <FeedbackItem key={f._id}>
                        <p>{f.content}</p>
                        <small>
                          {new Date(f.createdAt).toLocaleDateString()}
                          {f.isEdited && (
                            <EditedIndicator>
                              Edited on {new Date(f.updatedAt).toLocaleDateString()}
                            </EditedIndicator>
                          )}
                        </small>
                        {f.givenBy === session?.user?.id && (
                          <div>
                            <Button onClick={() => openModal(candidate, f)}>Edit</Button>
                            <Button onClick={() => handleDeleteFeedback(f._id)}>Delete</Button>
                          </div>
                        )}
                      </FeedbackItem>
                    ))
                  ) : (
                    <p>No feedback yet.</p>
                  )}
                </AccordionContent>
              )}
            </div>
          );
        })}
      </CandidateTable>

      {isModalOpen && selectedCandidate && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>
              {editingFeedback ? 'Edit' : 'Add'} Feedback for {selectedCandidate.name}
            </ModalTitle>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <ModalActions>
              <Button onClick={closeModal}>Cancel</Button>
              <Button onClick={handleFeedbackSubmit}>Submit</Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default FeedbackPage;