'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import Tooltip from '@mui/material/Tooltip';
import { useSession } from 'next-auth/react';
import { NextSemIcon } from '../../../app/components/icons/tags/NextSemIcon';
import { ErasmusIcon } from '../../../app/components/icons/tags/ErasmusIcon';
import { FriendIcon } from '../../../app/components/icons/tags/FriendIcon';
import { RedFlagIcon } from '../../../app/components/icons/tags/RedFlagIcon';
import LoadingSpinner from '@/app/components/loaders/LoadingSpinner';
import { AcceptButton } from '@/app/components/buttons/AcceptButton';
import { useToast } from '@/app/components/toasts/ToastContext';
import { IInterview } from '@/lib/models/interview';
import { ICandidate } from '@/lib/models/candidate';
import { IUser } from '@/lib/models/user';
import Modal from '@/app/components/modals/Modal';
import InterviewModal from '@/app/components/modals/InterviewModal';
import { EditButton } from '@/app/components/buttons/EditButton';
import { IForm } from '@/lib/models/form';
import { IFormResponse } from '@/lib/models/formResponse';

const availableTags = [
    { tag: 'nextSem', label: 'Próximo Cuatri', Icon: NextSemIcon },
    { tag: 'erasmus', label: 'Erasmus', Icon: ErasmusIcon },
    { tag: 'friend', label: 'Amigo', Icon: FriendIcon },
    { tag: 'redFlag', label: 'Red Flag', Icon: RedFlagIcon },
];

const PageContainer = styled.div`
  padding: 20px;
`;

const MainContent = styled.div`
    max-width: 1000px;
    margin: 0 auto;
`;

const Section = styled.section`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  border-bottom: 2px solid var(--border-secondary);
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const CandidateTableContainerWrapper = styled.div`
  overflow-x: auto;
`;

const CandidateTableContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-primary);
  border-radius: 5px;
  width: fit-content;
`;

const TableHeader = styled.div<{ gridtemplatecolumns: string }>`
  display: grid;
  grid-template-columns: ${props => props.gridtemplatecolumns};
  padding: 10px 15px;
  background-color: var(--table-header-bg);
  font-weight: bold;
  border-bottom: 1px solid var(--border-primary);
  align-items: center;
  min-width: max-content;
`;

const TableRow = styled.div<{ gridtemplatecolumns: string }>`
  display: grid;
  grid-template-columns: ${props => props.gridtemplatecolumns};
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid var(--border-secondary);
  text-decoration: none;
  color: inherit;
  min-width: fit-content;

  &:hover {
    background-color: var(--table-row-hover-bg);
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

const CandidateName = styled(Link)`
  font-weight: bold;
  color: var(--link-color);
  &:hover {
    text-decoration: underline;
  }
`;

const DataCell = styled.div`
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0; /* Allow content to shrink */
`;

const ItemCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const TagIconsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, min-content);
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-left: -10px;
  margin-right: -10px;
  width: 40px;
  height: 40px;
  color: var(--brand-primary-dark);
`;

const CandidateCardContainerWrapper = styled.div`
  overflow-x: auto;
`;

const CandidateCardContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
`;

const CandidateCard = styled.div<{ $hasInterviewResponse?: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border: 1px solid ${props => props.$hasInterviewResponse ? 'var(--brand-primary)' : 'var(--border-primary)'};
    border-radius: 16px;
    background-color: var(--bg-primary);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    transition: box-shadow 0.3s ease;
    width: fit-content;

    &:hover {
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
`;

const TasksPage: React.FC = () => {
    const { data: session } = useSession();
    const [candidates, setCandidates] = useState<ICandidate[]>([]);
    const [interviews, setInterviews] = useState<IInterview[]>([]);
    const [users, setUsers] = useState<IUser[]>([]);
    const [forms, setForms] = useState<IForm[]>([]);
    const [formResponses, setFormResponses] = useState<IFormResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInterview, setEditingInterview] = useState<IInterview | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [candidatesRes, interviewsRes, usersRes, formsRes, formResponsesRes] = await Promise.all([
                fetch('/api/candidates'),
                fetch('/api/interviews'),
                fetch('/api/users'),
                fetch('/api/forms'),
                fetch('/api/form-responses'),
            ]);

            if (candidatesRes.ok) {
                const data = await candidatesRes.json();
                setCandidates(data.candidates);
            } else {
                console.error("Failed to fetch candidates");
                addToast("Error al cargar los candidatos", "error");
            }

            if (interviewsRes.ok) {
                const data = await interviewsRes.json();
                setInterviews(data);
            } else {
                console.error("Failed to fetch interviews");
                addToast("Error al cargar las entrevistas", "error");
            }

            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data);
            } else {
                console.error("Failed to fetch users");
                addToast("Error al cargar los usuarios", "error");
            }

            if (formsRes.ok) {
                const data = await formsRes.json();
                setForms(data);
            } else {
                console.error("Failed to fetch forms");
                addToast("Error al cargar los formularios", "error");
            }

            if (formResponsesRes.ok) {
                const data = await formResponsesRes.json();
                setFormResponses(data);
            } else {
                console.error("Failed to fetch form responses");
                addToast("Error al cargar las respuestas de los formularios", "error");
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            addToast("Error al cargar los datos", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openModal = (interview: IInterview | null = null) => {
        setEditingInterview(interview);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setEditingInterview(null);
        setIsModalOpen(false)
    };

    const handleSave = async (interviewData: Partial<IInterview>, events: Record<string, ICandidate['events']>) => {
        const isEditing = !!editingInterview;
        const url = isEditing ? `/api/interviews/${editingInterview?._id}` : '/api/interviews';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ interviewData, events }),
            });

            if (res.ok) {
                addToast(`Entrevista ${isEditing ? 'actualizada' : 'creada'} correctamente`, 'success');
                closeModal();
                fetchData();
                window.dispatchEvent(new CustomEvent('updateTasksDot'));
            } else {
                addToast("Error al guardar la entrevista", "error");
            }
        } catch (error) {
            console.error("Error al guardar la entrevista:", error);
            addToast("Error al guardar la entrevista", "error");
        }
    };

    const handleMarkAsSent = async (candidateIds: string[]) => {
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ candidateIds }),
            });

            if (res.ok) {
                addToast("Emails marcados como enviados", "success");
                fetchData();
                window.dispatchEvent(new CustomEvent('updateTasksDot'));
            } else {
                addToast("Error al marcar los emails como enviados", "error");
            }
        } catch (error) {
            console.error("Error marking emails as sent:", error);
            addToast("Error al marcar los emails como enviados", "error");
        }
    };

    const activeCandidatesWithPendingEmails = candidates.filter(c => c.active && !c.emailSent);
    const inactiveCandidatesWithPendingEmails = candidates.filter(c => !c.active && !c.emailSent);
    const activeEmails = activeCandidatesWithPendingEmails.map(c => c.email).join(', ');

    const nonFeedbackStatuses = ["cancelled", "absent"];

    const interviewsWithPendingFeedback = interviews.filter(interview => {
        const interviewDate = new Date(interview.date);
        if (!session?.user?.id || !interview.interviewers.includes(session.user.id) || interviewDate.getTime() > Date.now()) {
            return false;
        }
        for (const candidateId of interview.candidates) {
            if (
                !interview.opinions[candidateId]?.interviewers[session.user.id]?.opinion &&
                !nonFeedbackStatuses.includes(interview.opinions[candidateId]?.status)
            ) {
                return true;
            }
        }
        return false;
    });

    const scheduledCandidateIds = new Set(interviews.flatMap(i => i.candidates));
    const unscheduledCandidates = candidates.filter(c => c.active && !scheduledCandidateIds.has(c._id));

    const interviewFormIds = new Set(forms.filter(f => f.formIdentifier?.startsWith('entrevista')).map(f => (f._id as string).toString()));
    const candidatesWithInterviewResponse = new Set(formResponses.filter(r => r.candidateId && interviewFormIds.has(r.formId.toString())).map(r => r.candidateId?.toString()));

    const interviewsWithUnnotifiedCandidates = interviews.filter(interview => {
        for (const candidateId of interview.candidates) {
            if (!interview.opinions[candidateId]?.interviewNotified) {
                return true;
            }
        }
        return false;
    });

    const gridtemplatecolumns = '40px 60px minmax(150px, 1fr) minmax(150px, 2fr) 85px';
    const defaultAvatar = '/default-avatar.jpg';

    return (
        <PageContainer>
            <h1>Tareas</h1>
            <MainContent>
                <Section>
                    <SectionTitle>Mis Tareas</SectionTitle>
                    {interviewsWithPendingFeedback.length > 0 ? (
                        interviewsWithPendingFeedback.map(interview => (
                            <ItemCard key={interview._id}>
                                <p>Tienes feedback pendiente para la entrevista del {new Date(interview.date).toLocaleString()}</p>
                                <EditButton onClick={() => openModal(interview)} />
                            </ItemCard>
                        ))
                    ) : (
                        <p>No tienes tareas pendientes.</p>
                    )}
                </Section>

                <Section>
                    <SectionTitle>Emails Pendientes</SectionTitle>
                    <h3>Activos</h3>
                    <ItemCard>
                        <p style={{ overflowWrap: "anywhere" }}>{activeEmails || "No hay emails pendientes."}</p>
                        {activeEmails && (
                            <AcceptButton 
                                onClick={() => handleMarkAsSent(activeCandidatesWithPendingEmails.map(c => c._id))} 
                                needsConfirmation={true}
                                confirmationDuration={3000}
                                showSpinner={true}
                            />
                        )}
                    </ItemCard>
                    <h3>Inactivos</h3>
                    <CandidateTableContainerWrapper>
                        <CandidateTableContainer>
                            <TableHeader gridtemplatecolumns={gridtemplatecolumns}>
                                <DataCell></DataCell>
                                <DataCell>Foto</DataCell>
                                <DataCell>Nombre</DataCell>
                                <DataCell>Motivo de Rechazo</DataCell>
                                <DataCell>Acciones</DataCell>
                            </TableHeader>
                            {loading ? (
                                <LoadingSpinner />
                            ) : inactiveCandidatesWithPendingEmails.length > 0 ? (
                                inactiveCandidatesWithPendingEmails.map(candidate => (
                                    <TableRow key={candidate._id} gridtemplatecolumns={gridtemplatecolumns}>
                                        <DataCell>
                                            <TagIconsContainer>
                                                {availableTags.map((tagInfo, idx) => {
                                                    const currentTag = candidate.tags?.find(t => t.tag === tagInfo.tag);
                                                    if (currentTag) {
                                                        const TagIconComponent = tagInfo.Icon;
                                                        const tooltipTitle = (
                                                            <>
                                                                <strong>{tagInfo.label}</strong>
                                                                {currentTag.comment && `: ${currentTag.comment}`}
                                                            </>
                                                        );
                                                        return (
                                                            <Tooltip
                                                                key={tagInfo.tag}
                                                                title={tooltipTitle}
                                                                arrow
                                                                placement={idx < 2 ? "top" : "bottom"}
                                                                slotProps={{
                                                                    tooltip: {
                                                                        sx: {
                                                                            fontSize: '1rem',
                                                                        },
                                                                    },
                                                                }}
                                                            >
                                                                <div style={{ height: 18 }}>
                                                                    <TagIconComponent iconSize={18} />
                                                                </div>
                                                            </Tooltip>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </TagIconsContainer>
                                        </DataCell>
                                        <DataCell><Avatar src={candidate.photoUrl || defaultAvatar} onError={(e) => (e.currentTarget.src = defaultAvatar)} /></DataCell>
                                        <DataCell><CandidateName href={`/profile/${candidate._id}`}>{candidate.name}</CandidateName></DataCell>
                                        <DataCell>{candidate.rejectedReason}</DataCell>
                                        <DataCell>
                                            <AcceptButton
                                                onClick={() => handleMarkAsSent([candidate._id])}
                                                needsConfirmation={true}
                                                showSpinner={true}
                                            />
                                        </DataCell>
                                    </TableRow>
                                ))
                            ) : (
                                <ItemCard style={{ border: 'none', marginBottom: 0 }}>No hay candidatos para mostrar.</ItemCard>
                            )}
                        </CandidateTableContainer>
                    </CandidateTableContainerWrapper>
                </Section>

                <Section>
                    <SectionTitle>Entrevistas por Calendarizar</SectionTitle>
                    {loading ? (
                        <LoadingSpinner />
                    ) : unscheduledCandidates.length > 0 ? (
                        <CandidateCardContainerWrapper>
                            <CandidateCardContainer>
                                {unscheduledCandidates.map(candidate => (
                                    <CandidateCard key={candidate._id} $hasInterviewResponse={candidatesWithInterviewResponse.has(candidate._id)}>
                                        <Avatar src={candidate.photoUrl || defaultAvatar} onError={(e) => (e.currentTarget.src = defaultAvatar)} />
                                        <CandidateName href={`/profile/${candidate._id}`}>{candidate.name}</CandidateName>
                                    </CandidateCard>
                                ))}
                            </CandidateCardContainer>
                        </CandidateCardContainerWrapper>
                    ) : (
                        <p>No hay candidatos por agendar.</p>
                    )}
                </Section>

                <Section>
                    <SectionTitle>Entrevistas sin Notificación</SectionTitle>
                    {loading ? (
                        <LoadingSpinner />
                    ) : interviewsWithUnnotifiedCandidates.length > 0 ? (
                        <CandidateTableContainerWrapper>
                            <CandidateTableContainer>
                            <TableHeader gridtemplatecolumns="60px 250px 300px 180px 1fr">
                                <DataCell>Foto</DataCell>
                                <DataCell>Candidato</DataCell>
                                <DataCell>Email</DataCell>
                                <DataCell>Fecha de Entrevista</DataCell>
                                <DataCell>Estado</DataCell>
                            </TableHeader>
                            {interviewsWithUnnotifiedCandidates.map(interview => (
                                interview.candidates.map(candidateId => {
                                    const candidate = candidates.find(c => c._id === candidateId);
                                    if (!candidate) return null;
                                    const isNotified = interview.opinions[candidateId]?.interviewNotified;

                                    return !isNotified && (
                                        <TableRow key={`${interview._id}-${candidateId}`} gridtemplatecolumns="60px 250px 300px 180px 1fr">
                                            <DataCell>
                                                <Avatar
                                                    src={candidate.photoUrl || defaultAvatar}
                                                    onError={(e) => (e.currentTarget.src = defaultAvatar)}
                                                />
                                            </DataCell>
                                            <DataCell>
                                                <CandidateName href={`/profile/${candidate._id}`}>
                                                    {candidate.name}
                                                </CandidateName>
                                            </DataCell>
                                            <DataCell>
                                                <span
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(candidate.email);
                                                        addToast("Email copiado", "success");
                                                    }}
                                                    style={{ cursor: 'pointer', color: 'var(--link-color)' }}
                                                >
                                                    {candidate.email}
                                                </span>
                                            </DataCell>
                                            <DataCell>
                                                {new Date(interview.date).toLocaleString()}
                                            </DataCell>
                                            <DataCell>
                                                <EditButton onClick={() => openModal(interview)} />
                                            </DataCell>
                                        </TableRow>
                                    );
                                })
                            ))}
                            </CandidateTableContainer>
                        </CandidateTableContainerWrapper>
                    ) : (
                        <p>No hay entrevistas sin notificación.</p>
                    )}
                </Section>

                <Modal isOpen={isModalOpen} title={editingInterview ? "Editar Entrevista" : "Añadir Entrevista"}>
                    <InterviewModal
                        users={users}
                        candidates={candidates}
                        interview={editingInterview}
                        onClose={closeModal}
                        onSave={handleSave}
                    />
                </Modal>
            </MainContent>
        </PageContainer>
    );
};

export default TasksPage;
