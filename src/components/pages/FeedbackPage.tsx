import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '../../../app/components/loaders/LoadingSpinner';
import { DeleteButton } from '../../../app/components/buttons/DeleteButton';
import { EditButton } from '../../../app/components/buttons/EditButton';
import { AddButton } from '../../../app/components/buttons/AddButton';
import { CancelButton } from '../../../app/components/buttons/CancelButton';
import { SaveButton } from '../../../app/components/buttons/SaveButton';
import { ViewButton } from '../../../app/components/buttons/ViewButton';
import { HideButton } from '../../../app/components/buttons/HideButton';
import { useToast } from '../../../app/components/toasts/ToastContext';
import Modal from '../../../app/components/modals/Modal';

const PageContainer = styled.div`
  padding: 20px;
`;

const CandidateTable = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  max-width: 1000px;
  margin: 0 auto;
`;

const TableHeader = styled.div<{ $isMobile: boolean }>`
  display: grid;
  grid-template-columns: 60px 1fr ${({ $isMobile }) => ($isMobile ? '120px' : '150px 120px')};
  padding: 10px 15px;
  background-color: var(--table-header-bg);
  font-weight: bold;
  border-bottom: 1px solid var(--border-primary);
`;

const TableRow = styled.div<{ $isTutor?: boolean; $isMobile: boolean }>`
  background-color: ${({ $isTutor }) => ($isTutor ? 'var(--tutor-row-bg)' : 'var(--bg-primary)')};
  display: grid;
  grid-template-columns: 60px 1fr ${({ $isMobile }) => ($isMobile ? '120px' : '150px 120px')};
  align-items: center;
  padding: 10px 15px;
  border-top: 2px solid var(--border-secondary);
  cursor: pointer;

  &:hover {
    background-color: ${({ $isTutor }) => ($isTutor ? 'var(--tutor-row-hover-bg)' : 'var(--table-row-hover-bg)')};
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
  padding: 0 10px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const AccordionContent = styled.div<{ $expanded: boolean; $hasFeedback: boolean }>`
  display: grid;
  grid-template-rows: ${({ $expanded }) => ($expanded ? '1fr' : '0fr')};
  transition: grid-template-rows 0.25s ease-in-out;
  overflow: hidden;

  & > div {
    overflow: hidden;
    padding-left: 20px;
    position: relative;

    @media (max-width: 768px) {
      margin-left: -20px; /* Move content 20px to the left */
    }
  }

  & > div::before {
    content: '';
    position: absolute;
    top: -10px;
    left: 44px;
    bottom: 10px;
    width: 2px;
    background-color: var(--border-primary);
  }
`;

const FeedbackItem = styled.div<{ $isMobile: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px 8px 40px;
  border-bottom: 1px solid var(--border-secondary);
  position: relative;

  &:before {
    content: '●';
    position: absolute;
    top: -1px;
    left:16.35px;
    color: #0070f040;
    font-family: monospace;
    font-size: 2.5em;
  }
    
  &:after {
    content: '●';
    position: absolute;
    top: 7px;
    left:20px;
    color: #0070f0;
    font-family: monospace;
    font-size: 1.5em;
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FeedbackContent = styled.div`
  flex-grow: 1;
  margin-right: 10px;

  @media (max-width: 768px) {
    width: 100%; /* Take full width on mobile */
    margin-right: 0;
    margin-bottom: 5px; /* Add some space below content */
  }
`;

const FeedbackActions = styled.div`
  display: flex;
  gap: 5px;
`;

const FeedbackDates = styled.small`
  font-size: 0.75em;
  color: var(--text-secondary);
  white-space: nowrap;

  @media (max-width: 768px) {
    white-space: normal; /* Allow text to wrap on mobile */
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 10px;
  border: 1px solid var(--border-primary);
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
  tutor: string;
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
  const { addToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const defaultAvatar = '/default-avatar.jpg';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

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
          setCandidates(data.candidates);
        } else {
          addToast('Error al obtener los candidatos', 'error');
        }

        if (feedbackRes.ok) {
          const data = await feedbackRes.json();
          setFeedback(data);
        } else {
          addToast('Error al obtener el feedback', 'error');
        }
      } catch {
        addToast('Ocurrió un error', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addToast]);

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

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: selectedCandidate._id,
          feedback: feedbackText.trim(),
        }),
      });

      if (res.ok) {
        const updatedFeedback = await res.json();
        if (editingFeedback) {
          setFeedback(
            feedback.map(f => (f._id === editingFeedback._id ? updatedFeedback : f))
          );
          addToast('Feedback actualizado correctamente', 'success');
        } else {
          setFeedback([...feedback, updatedFeedback]);
          addToast('Feedback añadido correctamente', 'success');
        }
        closeModal();
      } else {
        addToast('No se pudo enviar el feedback', 'error');
      }
    } catch {
      addToast('Ocurrió un error', 'error');
    }
  };

  const tutorCandidates = candidates.filter(candidate => candidate.tutor === session?.user?.email);
  const otherCandidates = candidates.filter(candidate => candidate.tutor !== session?.user?.email);

  const sortedCandidates = [...tutorCandidates, ...otherCandidates];

  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setFeedback(feedback.filter(f => f._id !== feedbackId));
        addToast('Feedback eliminado correctamente', 'success');
      } else {
        addToast('No se pudo eliminar el feedback', 'error');
      }
    } catch {
      addToast('Ocurrió un error', 'error');
    }
  };

  return (
    <PageContainer>
      <h1>Feedback</h1>
      <CandidateTable>
        <TableHeader $isMobile={isMobile}>
          <DataCell>Foto</DataCell>
          <DataCell>Nombre</DataCell>
          {!isMobile && <DataCell>Comentarios Añadidos</DataCell>}
          <DataCell>Acciones</DataCell>
        </TableHeader>
        {loading ? (
          <LoadingSpinner />
        ) : candidates.length > 0 ? (
          sortedCandidates.map(candidate => {
            const candidateFeedback = feedback.filter(f => f.candidateId === candidate._id && f.givenBy === session?.user?.id);
            const isExpanded = expandedRows.includes(candidate._id);
            const hasFeedback = candidateFeedback.length > 0;

            return (
              <div key={candidate._id}>
                <TableRow
                  onClick={() => handleRowClick(candidate._id)}
                  $isTutor={candidate.tutor === session?.user?.email}
                  $isMobile={isMobile}
                >
                  <DataCell>
                    <Avatar src={candidate.photoUrl || defaultAvatar} onError={(e) => (e.currentTarget.src = defaultAvatar)} />
                  </DataCell>
                  <DataCell>
                    <CandidateName>{candidate.name}</CandidateName>
                  </DataCell>
                  {!isMobile && <DataCell>{candidateFeedback.length}</DataCell>}
                  <ActionsCell>
                    {isExpanded ? (
                      <HideButton
                        onClick={() => handleRowClick(candidate._id)}
                        ariaLabel="Ocultar comentarios"
                        iconSize={22}
                      />
                    ) : (
                      <ViewButton
                        onClick={() => handleRowClick(candidate._id)}
                        ariaLabel="Ver comentarios"
                        iconSize={22}
                        disabled={!hasFeedback}
                      />
                    )}
                    <AddButton
                      onClick={() => openModal(candidate)}
                      ariaLabel="Añadir Comentario"
                      showSpinner={false}
                      iconSize={22}
                    />
                  </ActionsCell>
                </TableRow>
                <AccordionContent $expanded={isExpanded} $hasFeedback={hasFeedback}>
                  <div>
                    {hasFeedback ? (
                      candidateFeedback.map(f => (
                        <FeedbackItem key={f._id} $isMobile={isMobile}>
                          <FeedbackContent>
                            {f.content.split('\n').map((line, idx) => (
                              <p key={idx}>{line}‎ </p>
                            ))}
                            <FeedbackDates>
                              Publicado el {new Date(f.createdAt).toLocaleDateString()}
                              {f.isEdited && (
                                <> · Editado el {new Date(f.updatedAt).toLocaleDateString()}</>
                              )}
                            </FeedbackDates>
                          </FeedbackContent>
                          {f.givenBy === session?.user?.id && (
                            <FeedbackActions>
                              <EditButton onClick={() => openModal(candidate, f)} iconSize={20} />
                              <DeleteButton onClick={() => handleDeleteFeedback(f._id)} iconSize={20} />
                            </FeedbackActions>
                          )}
                        </FeedbackItem>
                      ))
                    ) : (
                      <p style={{padding: 15, paddingLeft: 40, paddingTop: 5}}>No hay comentarios para este newbie.</p>
                    )}
                  </div>
                </AccordionContent>
              </div>
            );
          })
        ) : (
          <p>No hay candidatos para mostrar.</p>
        )}
      </CandidateTable>

      {selectedCandidate && (
        <Modal
          isOpen={isModalOpen}
          // onClose={closeModal}
          title={`${editingFeedback ? 'Editar' : 'Añadir'} Comentario para ${selectedCandidate.name}`}
          width='sm'
        >
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
          <ModalActions>
            <CancelButton onClick={closeModal} />
            <SaveButton onClick={handleFeedbackSubmit} />
          </ModalActions>
        </Modal>
      )}
    </PageContainer>
  );
};

export default FeedbackPage;