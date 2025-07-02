import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '../../../app/components/loaders/LoadingSpinner';
import { ButtonProvider } from '../../../app/components/buttons/IconButton';
import { DeleteButton } from '../../../app/components/buttons/DeleteButton';
import { EditButton } from '../../../app/components/buttons/EditButton';
import { AddButton } from '../../../app/components/buttons/AddButton';
import { CancelButton } from '../../../app/components/buttons/CancelButton';
import { SaveButton } from '../../../app/components/buttons/SaveButton';

const PageContainer = styled.div`
  padding: 20px;
`;

const CandidateTable = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: var(--border-radius-md);
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

const AccordionContent = styled.div<{ expanded: boolean }>`
  background-color: #f9f9f9;
  max-height: ${({ expanded }) => (expanded ? '9999px' : '0')};
  padding-left: 35px;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
`;

const FeedbackItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
  &:last-child {
    border-bottom: none;
  }
`;

const FeedbackContent = styled.div`
  flex-grow: 1;
  margin-right: 10px;
`;

const FeedbackActions = styled.div`
  display: flex;
  gap: 5px;
`;

const FeedbackDates = styled.small`
  font-size: 0.75em;
  color: #666;
  white-space: nowrap;
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
  border-radius: var(--border-radius-md);
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
  border-radius: var(--border-radius-md);
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
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(true); // Add loading state
  const defaultAvatar = '/default-avatar.jpg';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [candidatesRes, feedbackRes] = await Promise.all([
          fetch('/api/candidates'),
          fetch('/api/feedback'),
        ]);

        if (candidatesRes.ok) {
          const data = await candidatesRes.json();
          setCandidates(data);
        }

        if (feedbackRes.ok) {
          const data = await feedbackRes.json();
          setFeedback(data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRowClick = (candidateId: string) => {
    setExpandedRows(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
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
      <h1>Feedback</h1> {/* Do not translate this line */}
      <CandidateTable>
        <TableHeader>
          <DataCell>Foto</DataCell>
          <DataCell>Nombre</DataCell>
          <DataCell>Comentarios Añadidos</DataCell>
          <DataCell>Acciones</DataCell>
        </TableHeader>
        {loading ? (
          <LoadingSpinner />
        ) : candidates.length > 0 ? (
          candidates.map(candidate => {
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
                    <AddButton
                      onClick={() => openModal(candidate)}
                      ariaLabel="Añadir Comentario"
                      showSpinner={false}
                    />
                  </ActionsCell>
                </TableRow>
                <AccordionContent expanded={expandedRows.includes(candidate._id)}>
                  {candidateFeedback.length > 0 ? (
                    candidateFeedback.map(f => (
                      <FeedbackItem key={f._id}>
                        <FeedbackContent>
                          <p>{f.content}</p>
                          <FeedbackDates>
                            Publicado el {new Date(f.createdAt).toLocaleDateString()}
                            {f.isEdited && (
                              <> · Editado el {new Date(f.updatedAt).toLocaleDateString()}</>
                            )}
                          </FeedbackDates>
                        </FeedbackContent>
                        {f.givenBy === session?.user?.id && (
                          <ButtonProvider>
                            <FeedbackActions>
                              <EditButton onClick={() => openModal(candidate, f)} iconSize={20} />
                              <DeleteButton onClick={() => handleDeleteFeedback(f._id)} iconSize={20} />
                            </FeedbackActions>
                          </ButtonProvider>
                        )}
                      </FeedbackItem>
                    ))
                  ) : (
                    <p>No hay comentarios todavía.</p>
                  )}
                </AccordionContent>
              </div>
            );
          })
        ) : (
          <p>No hay candidatos para mostrar.</p>
        )}
      </CandidateTable>

      {isModalOpen && selectedCandidate && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>
              {editingFeedback ? 'Editar' : 'Añadir'} Comentario para {selectedCandidate.name}
            </ModalTitle>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <ModalActions>
              <CancelButton
                onClick={closeModal}
              />
              <SaveButton
                onClick={handleFeedbackSubmit}
              />
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default FeedbackPage;