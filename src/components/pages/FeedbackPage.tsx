import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useSession } from "next-auth/react";
import LoadingSpinner from "../../../app/components/loaders/LoadingSpinner";
import Link from "next/link";
import { DeleteButton } from "../../../app/components/buttons/DeleteButton";
import { EditButton } from "../../../app/components/buttons/EditButton";
import { AddButton } from "../../../app/components/buttons/AddButton";
import { CancelButton } from "../../../app/components/buttons/CancelButton";
import { SaveButton } from "../../../app/components/buttons/SaveButton";
import { ViewButton } from "../../../app/components/buttons/ViewButton";
import { HideButton } from "../../../app/components/buttons/HideButton";
import { useToast } from "../../../app/components/toasts/ToastContext";
import Modal from "../../../app/components/modals/Modal";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

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

const TableHeader = styled.div<{ $isMobile: boolean; $isNewbie?: boolean }>`
  display: grid;
  grid-template-columns: 60px 1fr ${({ $isMobile, $isNewbie }) =>
      $isMobile ? "120px" : $isNewbie ? "200px 120px" : "150px 120px"};
  padding: 10px 15px;
  background-color: var(--table-header-bg);
  font-weight: bold;
  border-bottom: 1px solid var(--border-primary);
`;

const TableRow = styled.div<{
  $isTutor?: boolean;
  $isMobile: boolean;
  $isNewbie?: boolean;
  $isSelected?: boolean;
}>`
  background-color: ${({ $isSelected, $isTutor }) => {
    if ($isSelected) return "rgba(0, 112, 240, 0.12)";
    return $isTutor ? "var(--tutor-row-bg)" : "var(--bg-primary)";
  }};
  display: grid;
  grid-template-columns: 60px 1fr ${({ $isMobile, $isNewbie }) =>
      $isMobile ? "120px" : $isNewbie ? "200px 120px" : "150px 120px"};
  align-items: center;
  padding: 10px 15px;
  border-top: 2px solid var(--border-secondary);
  cursor: pointer;

  &:hover {
    background-color: ${({ $isSelected, $isTutor }) => {
      if ($isSelected) return "rgba(0, 112, 240, 0.18)";
      return $isTutor ? "var(--tutor-row-hover-bg)" : "var(--table-row-hover-bg)";
    }};
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

const CandidateLink = styled(Link)`
  font-weight: bold;
  color: var(--link-color);
  &:hover {
    text-decoration: underline;
  }
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
  grid-template-rows: ${({ $expanded }) => ($expanded ? "1fr" : "0fr")};
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
    content: "";
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
    content: "●";
    position: absolute;
    top: -1px;
    left: 16.35px;
    color: #0070f040;
    font-family: monospace;
    font-size: 2.5em;
  }

  &:after {
    content: "●";
    position: absolute;
    top: 7px;
    left: 20px;
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

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const MobileSelectionWrapper = styled.div`
  padding: 5px 40px;
  display: flex;
  justify-content: center;
`;

const MobileSelectionLabel = styled.span`
  font-weight: 500;
  line-height: 1.4;
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

interface FeedbackPageProps {
  maxNewbieSelections?: number;
}

const FeedbackPage: React.FC<FeedbackPageProps> = ({ maxNewbieSelections = 3 }) => {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [newbieSelections, setNewbieSelections] = useState<string[]>([]);
  const [isSavingSelection, setIsSavingSelection] = useState(false);
  const defaultAvatar = "/default-avatar.jpg";
  const isNewbie = session?.user?.newbie;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [candidatesRes, feedbackRes] = await Promise.all([
          fetch("/api/candidates/active"),
          fetch("/api/feedback")
        ]);

        if (candidatesRes.ok) {
          const data = await candidatesRes.json();
          setCandidates(data.candidates);
        } else {
          addToast("Error al obtener los candidatos", "error");
        }

        if (feedbackRes.ok) {
          const data = await feedbackRes.json();
          setFeedback(data);
        } else {
          addToast("Error al obtener el feedback", "error");
        }
      } catch {
        addToast("Ocurrió un error", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addToast]);

  useEffect(() => {
    if (!isNewbie) {
      setNewbieSelections([]);
      return;
    }

    const fetchSelections = async () => {
      try {
        const res = await fetch("/api/users/newbie-selections");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.selections)) {
            setNewbieSelections(data.selections);
          }
        } else {
          console.error("Failed to fetch newbie selections");
        }
      } catch (error) {
        console.error("Error fetching newbie selections", error);
      }
    };

    fetchSelections();
  }, [isNewbie]);

  const handleNewbieSelectionToggle = async (candidateId: string) => {
    if (!isNewbie) return;
    if (isSavingSelection) return;

    const previousSelections = [...newbieSelections];
    const isAlreadySelected = previousSelections.includes(candidateId);

    if (!isAlreadySelected && previousSelections.length >= maxNewbieSelections) {
      addToast(`Solo puedes seleccionar ${maxNewbieSelections} candidatos.`, "info");
      return;
    }

    const nextSelections = isAlreadySelected
      ? previousSelections.filter((id) => id !== candidateId)
      : [...previousSelections, candidateId];

    setNewbieSelections(nextSelections);
    setIsSavingSelection(true);

    try {
      const res = await fetch("/api/users/newbie-selections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ selections: nextSelections })
      });

      if (!res.ok) {
        throw new Error("Failed to persist selections");
      }
    } catch (error) {
      console.error("Error saving newbie selection", error);
      setNewbieSelections(previousSelections);
      addToast("No se pudo guardar tu selección. Inténtalo de nuevo.", "error");
    } finally {
      setIsSavingSelection(false);
    }
  };

  const handleRowClick = (candidateId: string) => {
    setExpandedRows((prev) =>
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]
    );
  };

  const openModal = (candidate: Candidate, feedbackToEdit?: Feedback) => {
    setSelectedCandidate(candidate);
    if (feedbackToEdit) {
      setEditingFeedback(feedbackToEdit);
      setFeedbackText(feedbackToEdit.content);
    } else {
      setEditingFeedback(null);
      setFeedbackText("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedCandidate(null);
    setEditingFeedback(null);
    setIsModalOpen(false);
    setFeedbackText("");
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedCandidate) return;

    const url = editingFeedback ? `/api/feedback/${editingFeedback._id}` : "/api/feedback";
    const method = editingFeedback ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          candidateId: selectedCandidate._id,
          feedback: feedbackText.trim()
        })
      });

      if (res.ok) {
        const updatedFeedback = await res.json();
        if (editingFeedback) {
          setFeedback(feedback.map((f) => (f._id === editingFeedback._id ? updatedFeedback : f)));
          addToast("Feedback actualizado correctamente", "success");
        } else {
          setFeedback([...feedback, updatedFeedback]);
          addToast("Feedback añadido correctamente", "success");
        }
        closeModal();
      } else {
        addToast("No se pudo enviar el feedback", "error");
      }
    } catch {
      addToast("Ocurrió un error", "error");
    }
  };

  const tutorCandidates = candidates.filter(
    (candidate) => candidate.tutor === session?.user?.email
  );
  const otherCandidates = candidates.filter(
    (candidate) => candidate.tutor !== session?.user?.email
  );

  const sortedCandidates = [...tutorCandidates, ...otherCandidates];

  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setFeedback(feedback.filter((f) => f._id !== feedbackId));
        addToast("Feedback eliminado correctamente", "success");
      } else {
        addToast("No se pudo eliminar el feedback", "error");
      }
    } catch {
      addToast("Ocurrió un error", "error");
    }
  };

  return (
    <PageContainer>
      <h1>Feedback</h1>
      <CandidateTable>
        <TableHeader $isMobile={isMobile} $isNewbie={isNewbie}>
          <DataCell>Foto</DataCell>
          <DataCell>Nombre</DataCell>
          {!isMobile && !isNewbie && <DataCell>Comentarios Añadidos</DataCell>}
          {!isMobile && isNewbie && (
            <DataCell>Te gustaría que esta persona entre contigo a ESN UAM?</DataCell>
          )}
          <DataCell>Acciones</DataCell>
        </TableHeader>
        {loading ? (
          <LoadingSpinner />
        ) : candidates.length > 0 ? (
          sortedCandidates.map((candidate) => {
            const candidateFeedback = feedback.filter(
              (f) => f.candidateId === candidate._id && f.givenBy === session?.user?.id
            );
            const isExpanded = expandedRows.includes(candidate._id);
            const hasFeedback = candidateFeedback.length > 0;
            const isCandidateSelected = newbieSelections.includes(candidate._id);

            return (
              <div key={candidate._id}>
                <TableRow
                  onClick={() => handleRowClick(candidate._id)}
                  $isTutor={candidate.tutor === session?.user?.email}
                  $isMobile={isMobile}
                  $isNewbie={isNewbie}
                  $isSelected={isCandidateSelected}
                >
                  <DataCell>
                    <Avatar
                      src={candidate.photoUrl || defaultAvatar}
                      onError={(e) => (e.currentTarget.src = defaultAvatar)}
                    />
                  </DataCell>
                  <DataCell>
                    {candidate.tutor === session?.user?.email ? (
                      <CandidateLink href={`/profile/${candidate._id}`}>
                        {candidate.name}
                      </CandidateLink>
                    ) : (
                      <CandidateName>{candidate.name}</CandidateName>
                    )}
                  </DataCell>
                  {!isMobile && !isNewbie && <DataCell>{candidateFeedback.length}</DataCell>}
                  {!isMobile && isNewbie && (
                    <DataCell onClick={(event) => event.stopPropagation()}>
                      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                        <Checkbox
                          checked={isCandidateSelected}
                          onChange={(event) => {
                            event.stopPropagation();
                            event.preventDefault();
                            void handleNewbieSelectionToggle(candidate._id);
                          }}
                          onClick={(event) => event.stopPropagation()}
                          disabled={
                            !isCandidateSelected &&
                            (isSavingSelection || newbieSelections.length >= maxNewbieSelections)
                          }
                          inputProps={{
                            "aria-label": "Seleccionar candidato como preferido"
                          }}
                          disableRipple={true}
                        />
                      </div>
                    </DataCell>
                  )}
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
                      disabled={isNewbie && hasFeedback}
                    />
                  </ActionsCell>
                </TableRow>
                <AccordionContent $expanded={isExpanded} $hasFeedback={hasFeedback}>
                  <div>
                    {isMobile && isNewbie && (
                      <MobileSelectionWrapper>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isCandidateSelected}
                              onChange={() => {
                                void handleNewbieSelectionToggle(candidate._id);
                              }}
                              disabled={
                                !isCandidateSelected &&
                                (isSavingSelection ||
                                  newbieSelections.length >= maxNewbieSelections)
                              }
                              inputProps={{
                                "aria-label": "Seleccionar candidato como preferido"
                              }}
                              disableRipple
                            />
                          }
                          label={
                            <MobileSelectionLabel>
                              ¿Te gustaría que esta persona entre contigo a ESN UAM?
                            </MobileSelectionLabel>
                          }
                        />
                      </MobileSelectionWrapper>
                    )}
                    {hasFeedback ? (
                      candidateFeedback.map((f) => (
                        <FeedbackItem key={f._id} $isMobile={isMobile}>
                          <FeedbackContent>
                            {f.content.split("\n").map((line, idx) => (
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
                              <DeleteButton
                                onClick={() => handleDeleteFeedback(f._id)}
                                iconSize={20}
                              />
                            </FeedbackActions>
                          )}
                        </FeedbackItem>
                      ))
                    ) : (
                      <p style={{ padding: 15, paddingLeft: 40, paddingTop: 5 }}>
                        No hay comentarios para este newbie.
                      </p>
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
          title={`${editingFeedback ? "Editar" : "Añadir"} comentario para ${selectedCandidate.name}`}
          width="sm"
        >
          <TextField
            multiline
            fullWidth
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            sx={{
              "& textarea": {
                minHeight: "100px",
                maxHeight: "300px"
              }
            }}
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
