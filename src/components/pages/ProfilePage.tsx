"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  TextField,
  Autocomplete,
  Switch,
  Checkbox,
  FormControlLabel,
  FormGroup
} from "@mui/material";
import Rating from "@mui/material/Rating";

import { AddButton } from "../../../app/components/buttons/AddButton";
import { SaveButton } from "../../../app/components/buttons/SaveButton";
import { EditButton } from "../../../app/components/buttons/EditButton";
import { CancelButton } from "../../../app/components/buttons/CancelButton";
import { DeleteButton } from "../../../app/components/buttons/DeleteButton";
import { useToast } from "../../../app/components/toasts/ToastContext";
import FormPreview from "../../../app/components/FormPreview";
import { FormStructure } from "@/lib/types/form";
import FeedbackForCandidate from "@/app/components/FeedbackForCandidate";
import Modal from "../../../app/components/modals/Modal";
import { InfoButton } from "../../../app/components/buttons/InfoButton";
import { AcceptButton } from "@/app/components/buttons/AcceptButton";
import { IInterview } from "@/lib/models/interview";

// Import tag icons
import { NextSemIcon } from "../../../app/components/icons/tags/NextSemIcon";
import { ErasmusIcon } from "../../../app/components/icons/tags/ErasmusIcon";
import { FriendIcon } from "../../../app/components/icons/tags/FriendIcon";
import { RedFlagIcon } from "../../../app/components/icons/tags/RedFlagIcon";

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface Committee {
  _id: string;
  name: string;
  color: string;
}

interface Candidate {
  _id: string;
  name: string;
  email: string;
  alternateEmails: string[];
  tutor: string;
  interests: string[];
  photoUrl?: string;
  active: boolean;
  rejectedReason?: string;
  tags?: { tag: string; comment?: string }[];
  events: {
    "Welcome Meeting": boolean | null;
    "Welcome Days": boolean | null;
    "Integration Weekend": boolean | null;
    "Plataforma Local": boolean | null;
  };
  recruitmentPhase: string;
}

interface FormResponse {
  _id: string;
  formId: { _id: string; structure: FormStructure };
  respondentEmail: string;
  responses: Map<string, string | number | boolean | object>;
  processed: boolean;
  submittedAt: string;
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Styled Components
const Container = styled.div`
  padding: 32px;
  max-width: 1000px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    margin-bottom: 15px;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 1.75rem;
    margin-bottom: 15px;
  }
`;

const ProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    margin-bottom: 15px;
  }
`;

const Avatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-primary);
`;

const InfoGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.95rem;

  @media (max-width: 768px) {
    align-items: center;
    text-align: center;
  }
`;

const LabelGroup = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 2px;
  }
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const Label = styled.span`
  font-weight: 600;
`;

const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }
`;

const EmailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
`;

const ChipContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Section = styled.div`
  margin-bottom: 40px;

  @media (max-width: 768px) {
    margin-bottom: 25px;
  }
`;

const SubTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 10px;
  }
`;

const InterestBadge = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border: 3px solid ${(props) => props.color};
  background-color: ${(props) => props.color}20;
  border-radius: 10px;
  font-size: 0.9rem;
  gap: 8px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
`;

const TagBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background-color: white;
  border: 1px solid var(--border-primary);
  font-size: 1rem;
  color: var(--text-primary);

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 0.9rem;
  }
`;

const TagCommentDisplay = styled.span`
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

const TagCommentInput = styled(TextField)`
  && {
    margin-left: 12px;
    .MuiInputBase-input {
      padding: 6px 10px;
      font-size: 0.9rem;
    }
    .MuiInputLabel-root {
      font-size: 0.9rem;
      transform: translate(14px, 8px) scale(1);
    }
    .MuiInputLabel-shrink {
      transform: translate(14px, -7px) scale(0.75);
    }
  }
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const InterviewCommentItem = styled.div`
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-md);
  padding: 10px;
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  gap: 10px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InterviewerAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const InterviewCommentContent = styled.div`
  flex-grow: 1;
`;

const InterviewerName = styled.p`
  font-weight: bold;
  color: var(--brand-primary);
  margin-bottom: 5px;
`;

const InterviewCommentText = styled.p`
  margin: 0;
  white-space: pre-wrap;
`;

const PhaseBanner = styled.div`
  background-color: color-mix(in srgb, var(--button-warning-bg), 25% transparent);
  border: 3px solid var(--button-warning-bg);
  border-radius: 8px;
  color: var(--button-primary-text);
  padding: 8px 32px;
  margin: -32px -32px 24px -32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;

  @media (max-width: 768px) {
    margin: 0 0 15px 0;
  }
`;

const availableTags = [
  { tag: "nextSem", label: "Próximo Cuatri", Icon: NextSemIcon },
  { tag: "erasmus", label: "Erasmus", Icon: ErasmusIcon },
  { tag: "friend", label: "Amigo", Icon: FriendIcon },
  { tag: "redFlag", label: "Red Flag", Icon: RedFlagIcon }
];

export default function ProfilePage({ isTutor }: { isTutor?: boolean }) {
  const params = useParams();
  const id = params && "id" in params ? (params.id as string) : undefined;
  const { addToast } = useToast();
  const { data: session } = useSession();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [currentPhase, setCurrentPhase] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [interviewComments, setInterviewComments] = useState<
    { interviewer: User; opinion: string }[]
  >([]);
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [availableCommittees, setAvailableCommittees] = useState<Committee[]>([]);
  const [candidateInterests, setCandidateInterests] = useState<Committee[]>([]);
  const [autocompleteInput, setAutocompleteInput] = useState("");
  const [showRejectedReasonModal, setShowRejectedReasonModal] = useState(false);
  const [tempRejectedReason, setTempRejectedReason] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [events, setEvents] = useState<Candidate["events"]>({
    "Welcome Meeting": false,
    "Welcome Days": false,
    "Integration Weekend": false,
    "Plataforma Local": false
  });
  const [isMobile, setIsMobile] = useState(false);

  const defaultAvatar = "/default-avatar.jpg";

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

  const fetchCommittees = useCallback(async () => {
    try {
      const res = await fetch("/api/committees");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAvailableCommittees(data);
    } catch (err) {
      console.error("Error fetching committees", err);
      addToast("Error al cargar los comités.", "error");
    }
  }, [addToast]);

  const fetchCandidate = useCallback(
    async (candidateId: string) => {
      try {
        const res = await fetch(`/api/candidates/${candidateId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCandidate(data);
        setEvents(data.events);

        if (availableCommittees.length > 0 && data.interests) {
          const interestsWithDetails = data.interests
            .map((interestId: string) =>
              availableCommittees.find((comm) => comm._id === interestId)
            )
            .filter(Boolean) as Committee[];
          setCandidateInterests(interestsWithDetails);
        }
      } catch {
        addToast("Error al cargar el perfil del candidato.", "error");
      }
    },
    [addToast, availableCommittees]
  );

  const fetchUsers = useCallback(async () => {
    if (isTutor) return;
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.filter((user: User) => user.email.endsWith("@esnuam.org")));
    } catch (err) {
      console.error("No se pudieron cargar los usuarios", err);
    }
  }, [isTutor]);

  const fetchFormResponses = useCallback(async () => {
    if (!id || isTutor) return;
    try {
      const res = await fetch(`/api/forms/candidate/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const processed = data.map((item: FormResponse) => ({
        ...item,
        responses: new Map(Object.entries(item.responses || {}))
      }));
      setFormResponses(processed);
    } catch (err) {
      console.error("Error al obtener respuestas del formulario", err);
    }
  }, [id, isTutor]);

  const fetchInterviewComments = useCallback(async () => {
    if (!id || isTutor) return;
    try {
      const res = await fetch(`/api/interviews/candidate/${id}`);
      if (!res.ok) throw new Error();
      const interviews: IInterview[] = await res.json();

      const comments: { interviewer: User; opinion: string }[] = [];
      interviews.forEach((interview) => {
        if (interview.opinions && interview.opinions[id!]) {
          const candidateOpinion = interview.opinions[id!];
          for (const interviewerId in candidateOpinion.interviewers) {
            const interviewer = users.find((u) => u._id === interviewerId);
            if (interviewer) {
              comments.push({
                interviewer: interviewer,
                opinion: candidateOpinion.interviewers[interviewerId].opinion
              });
            }
          }
        }
      });
      setInterviewComments(comments);
    } catch (err) {
      console.error("Error al obtener comentarios de entrevistas", err);
      addToast("Error al cargar comentarios de entrevistas.", "error");
    }
  }, [id, users, addToast, isTutor]);

  const fetchNote = useCallback(async () => {
    if (!session || !session.user || !candidate) return;
    try {
      const res = await fetch("/api/users/notes");
      if (!res.ok) throw new Error();
      const notes = await res.json();
      setNote(notes[candidate._id] || "");
    } catch (err) {
      console.error("Error fetching note", err);
    }
  }, [session, candidate]);

  const fetchRating = useCallback(async () => {
    if (!session || !session.user || !candidate || isTutor) return;
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error();
      const users: unknown = await res.json();
      const arr: unknown[] = Array.isArray(users) ? users : [];
      const isUser = (u: unknown): u is { _id: string; ratings?: Record<string, number> } =>
        typeof u === "object" && u !== null && typeof (u as { _id?: unknown })._id === "string";
      const sid = session.user!.id;
      const current = arr.find(
        (u): u is { _id: string; ratings?: Record<string, number> } => isUser(u) && u._id === sid
      );
      const r = current?.ratings ? current.ratings[candidate._id] : undefined;
      setRating(typeof r === "number" ? r : null);
    } catch (err) {
      console.error("Error fetching rating", err);
    }
  }, [session, candidate, isTutor]);

  const fetchCurrentPhase = useCallback(async () => {
    try {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Failed to fetch config");
      const config = await res.json();
      setCurrentPhase(config.recruitmentPhase);
    } catch (error) {
      console.error(error);
      addToast("Error al cargar la fase actual.", "error");
    }
  }, [addToast]);

  useEffect(() => {
    fetchCommittees();
    fetchCurrentPhase();
  }, [fetchCommittees, fetchCurrentPhase]);

  useEffect(() => {
    if (id) {
      fetchCandidate(id);
      fetchUsers();
      fetchFormResponses();
    }
  }, [id, fetchCandidate, fetchUsers, fetchFormResponses]);

  useEffect(() => {
    if (id && users.length > 0) {
      // Ensure users are loaded before fetching comments
      fetchInterviewComments();
    }
  }, [id, users, fetchInterviewComments]);

  useEffect(() => {
    if (session && candidate) {
      fetchNote();
      fetchRating();
    }
  }, [session, candidate, fetchNote, fetchRating]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isTutor) return;
    if (candidate) {
      setCandidate({ ...candidate, [e.target.name]: e.target.value });
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    if (isTutor) return;
    if (candidate) {
      const newEmails = [...candidate.alternateEmails];
      newEmails[index] = value;
      setCandidate({ ...candidate, alternateEmails: newEmails });
    }
  };

  const addEmail = () => {
    if (isTutor) return;
    if (candidate) {
      setCandidate({ ...candidate, alternateEmails: [...candidate.alternateEmails, ""] });
    }
  };

  const removeEmail = (index: number) => {
    if (isTutor) return;
    if (candidate) {
      const updated = candidate.alternateEmails.filter((_, i) => i !== index);
      setCandidate({ ...candidate, alternateEmails: updated });
    }
  };

  const handleAddInterest = (committee: Committee | null) => {
    if (isTutor) return;
    if (candidate && committee && !candidateInterests.some((i) => i._id === committee._id)) {
      setCandidateInterests([...candidateInterests, committee]);
    }
  };

  const handleRemoveInterest = (interestId: string) => {
    if (isTutor) return;
    if (candidate) {
      setCandidateInterests(candidateInterests.filter((i) => i._id !== interestId));
    }
  };

  const handleAddTag = (tag: string) => {
    if (isTutor) return;
    if (candidate) {
      const newTags = candidate.tags ? [...candidate.tags] : [];
      if (!newTags.some((t) => t.tag === tag)) {
        newTags.push({ tag });
        setCandidate({ ...candidate, tags: newTags });
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (isTutor) return;
    if (candidate && candidate.tags) {
      const newTags = candidate.tags.filter((tag) => tag.tag !== tagToRemove);
      setCandidate({ ...candidate, tags: newTags });
    }
  };

  const handleTagCommentChange = (tagToUpdate: string, comment: string) => {
    if (isTutor) return;
    if (candidate && candidate.tags) {
      const newTags = candidate.tags.map((tag) =>
        tag.tag === tagToUpdate ? { ...tag, comment } : tag
      );
      setCandidate({ ...candidate, tags: newTags });
    }
  };

  const handleEventChange = (eventName: keyof Candidate["events"]) => {
    if (isTutor) return;
    setEvents((prevEvents) => {
      const currentStatus = prevEvents[eventName];
      let newStatus: boolean | null;
      if (currentStatus === false) {
        newStatus = true;
      } else if (currentStatus === true) {
        newStatus = null;
      } else {
        // currentStatus is null or undefined
        newStatus = false;
      }
      return {
        ...prevEvents,
        [eventName]: newStatus
      };
    });
  };

  const handleSave = async () => {
    if (!candidate || isTutor) return;
    try {
      const sanitizedMainEmail = candidate.email.trim().toLowerCase();
      if (!isValidEmail(sanitizedMainEmail)) {
        addToast(`Correo principal inválido: ${sanitizedMainEmail}`, "error");
        return;
      }

      const cleanedAlternateEmails = candidate.alternateEmails
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email !== "");

      for (const email of cleanedAlternateEmails) {
        if (!isValidEmail(email)) {
          addToast(`Correo alternativo inválido: ${email}`, "error");
          return;
        }
      }

      const updatedCandidate = {
        ...candidate,
        email: sanitizedMainEmail,
        tutor: candidate.tutor,
        alternateEmails: cleanedAlternateEmails,
        interests: candidateInterests.map((i) => i._id),
        rejectedReason: candidate.rejectedReason || undefined,
        tags: candidate.tags || [],
        events: events
      };

      const res = await fetch(`/api/candidates/${candidate._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCandidate)
      });
      if (!res.ok) throw new Error();
      setIsEditing(false);
      setCandidate(updatedCandidate);
      addToast("Perfil actualizado con éxito", "success");
    } catch {
      addToast("Error al actualizar el perfil", "error");
    }
  };

  const handleSaveNote = async () => {
    if (!session || !session.user || !candidate) return;
    try {
      const res = await fetch("/api/users/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate._id, note })
      });

      if (!res.ok) throw new Error();
      addToast("Nota guardada con éxito", "success");
    } catch {
      addToast("Error al guardar la nota", "error");
    }
  };

  const labels: Record<number, string> = {
    1: "No",
    2: "Quizá/No",
    3: "Quizá",
    4: "Quizá/Sí",
    5: "Sí"
  };

  const handleRatingChange = async (_: unknown, value: number | null) => {
    if (!candidate) return;
    const next = value === rating ? null : value;
    setRating(next);
    try {
      const res = await fetch("/api/users/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate._id, rating: next })
      });
      if (!res.ok) throw new Error();
      addToast("Valoración guardada", "success");
    } catch {
      addToast("Error al guardar la valoración", "error");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (id) fetchCandidate(id);
  };

  const handleActiveSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!candidate) return;

    const newActiveStatus = e.target.checked;
    if (!newActiveStatus) {
      setIsDeactivating(true);
      setTempRejectedReason(candidate.rejectedReason || "");
      setShowRejectedReasonModal(true);
    } else {
      setCandidate({ ...candidate, active: true, rejectedReason: undefined });
    }
  };

  const handleRejectedReasonSave = () => {
    if (candidate) {
      setCandidate({ ...candidate, active: false, rejectedReason: tempRejectedReason });
      setShowRejectedReasonModal(false);
      setIsDeactivating(false);
    }
  };

  const handleRejectedReasonCancel = () => {
    if (isDeactivating && candidate) {
      setCandidate({ ...candidate, active: true });
    }
    setShowRejectedReasonModal(false);
    setIsDeactivating(false);
  };

  const handleInfoButtonClick = () => {
    if (candidate) {
      setTempRejectedReason(candidate.rejectedReason || "");
      setShowRejectedReasonModal(true);
      setIsDeactivating(false);
    }
  };

  const handlePhaseChange = async () => {
    if (!candidate) return;
    try {
      const res = await fetch(`/api/candidates/${candidate._id}/phase`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error();
      const updatedCandidate = await res.json();
      setCandidate(updatedCandidate);
      addToast("Fase actualizada con éxito", "success");
    } catch {
      addToast("Error al actualizar la fase", "error");
    }
  };

  if (!candidate) return <div>Cargando...</div>;

  const isDifferentPhase = candidate.recruitmentPhase !== currentPhase;

  return (
    <Container>
      <Title>Perfil del Candidato</Title>

      {isDifferentPhase && !isTutor && (
        <PhaseBanner>
          <span>
            Este candidato está en la fase de {candidate.recruitmentPhase}, pero la fase actual es{" "}
            {currentPhase}. Pulsa el botón para cambiar de fase:
          </span>
          <AcceptButton onClick={handlePhaseChange} needsConfirmation={true} showSpinner={true} />
        </PhaseBanner>
      )}

      <Header>
        <ProfileCard>
          <Avatar
            src={candidate.photoUrl || defaultAvatar}
            alt="Foto del candidato"
            onError={(e) => (e.currentTarget.src = defaultAvatar)}
          />
          <InfoGroup>
            <LabelGroup>
              <Label>Nombre:</Label> {candidate.name}
            </LabelGroup>
            <LabelGroup>
              <Label>Correo principal:</Label> {candidate.email}
            </LabelGroup>
            <LabelGroup>
              <Label>Padrino:</Label> {candidate.tutor || "Ninguno"}
            </LabelGroup>

            <ToggleGroup>
              <Label style={{ marginBottom: 0, userSelect: "none" }}>Activo:</Label>
              <div style={{ marginTop: -2, display: "flex", alignItems: "center" }}>
                <Switch
                  id="status-toggle"
                  checked={candidate.active ?? true}
                  disabled={!isEditing}
                  onChange={handleActiveSwitchChange}
                  size="small"
                />
                {!candidate.active && (
                  <InfoButton
                    onClick={handleInfoButtonClick}
                    iconSize={20}
                    style={{ marginLeft: 5 }}
                  />
                )}
              </div>
            </ToggleGroup>
          </InfoGroup>
        </ProfileCard>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
          {isEditing ? (
            <>
              <SaveButton onClick={handleSave} />
              <CancelButton onClick={handleCancel} />
            </>
          ) : (
            <EditButton onClick={() => setIsEditing(true)} disabled={isTutor} />
          )}
        </div>
      </Header>

      {/* Photo URL Field (full width) */}
      <TextField
        label="URL de Foto"
        name="photoUrl"
        value={candidate.photoUrl || ""}
        onChange={handleInputChange}
        disabled={!isEditing}
        fullWidth
        style={{ marginBottom: isMobile ? 20 : 32 }}
      />

      {/* Name | Tutor */}
      <TwoColumn>
        <TextField
          label="Nombre"
          name="name"
          value={candidate.name}
          onChange={handleInputChange}
          disabled={!isEditing}
          fullWidth
        />
        <Autocomplete
          options={users.map((u) => u.email)}
          freeSolo
          value={candidate.tutor}
          onChange={(_, newValue) => setCandidate({ ...candidate, tutor: newValue || "" })}
          onInputChange={(_, newInput) => setCandidate({ ...candidate, tutor: newInput })}
          renderInput={(params) => (
            <TextField {...params} label="Padrino" disabled={!isEditing} fullWidth />
          )}
          disabled={!isEditing}
        />
      </TwoColumn>

      {/* Tags Section */}
      <Section>
        <SubTitle>Etiquetas</SubTitle>
        <TagsContainer>
          {availableTags.map((tagInfo) => {
            const currentTag = candidate.tags?.find((t) => t.tag === tagInfo.tag);
            const isRedFlag = tagInfo.tag === "redFlag";
            const hasNoComment = tagInfo.tag === "erasmus" || tagInfo.tag === "nextSem";
            const TagIconComponent = tagInfo.Icon;

            // Conditional rendering for Red Flag when editing
            if (isEditing && isRedFlag && !currentTag) {
              return null;
            }

            // Conditional rendering for tags when not editing
            if (!isEditing && !currentTag) {
              return null;
            }

            return (
              <TagBadge key={tagInfo.tag}>
                <TagIconComponent iconSize={24} />
                <span>
                  {tagInfo.label + (!isEditing && currentTag && currentTag.comment ? ":" : "")}
                </span>
                {isEditing && !isRedFlag && (
                  <Switch
                    checked={!!currentTag}
                    onChange={() => {
                      if (currentTag) {
                        handleRemoveTag(tagInfo.tag);
                      } else {
                        handleAddTag(tagInfo.tag);
                      }
                    }}
                    size="small"
                  />
                )}
                {isEditing && currentTag && !hasNoComment && (
                  <TagCommentInput
                    label="Comentario"
                    value={currentTag.comment || ""}
                    onChange={(e) => handleTagCommentChange(tagInfo.tag, e.target.value)}
                    disabled={!isEditing || isRedFlag}
                    size="small"
                    variant="outlined"
                    fullWidth={isMobile} // Make input full width on mobile
                  />
                )}
                {!isEditing && currentTag && currentTag.comment && !hasNoComment && (
                  <TagCommentDisplay>{currentTag.comment}</TagCommentDisplay>
                )}
              </TagBadge>
            );
          })}
          {!isEditing && (!candidate.tags || candidate.tags.length === 0) && (
            <p>No hay etiquetas para mostrar.</p>
          )}
        </TagsContainer>
      </Section>

      {/* Emails | Interests */}
      <TwoColumn>
        <div>
          <SubTitle>Correos electrónicos</SubTitle>
          <EmailRow>
            <TextField
              label="Correo principal"
              value={candidate.email}
              onChange={(e) => setCandidate({ ...candidate, email: e.target.value })}
              disabled={!isEditing}
              fullWidth
            />
            <DeleteButton onClick={() => {}} disabled />
          </EmailRow>
          {candidate.alternateEmails.map((email, index) => (
            <EmailRow key={index}>
              <TextField
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                disabled={!isEditing}
                fullWidth
              />
              {isEditing ? (
                <DeleteButton onClick={() => removeEmail(index)} />
              ) : (
                <DeleteButton onClick={() => {}} disabled />
              )}
            </EmailRow>
          ))}
          {isEditing && <AddButton onClick={addEmail} />}
        </div>

        <div>
          <SubTitle>Intereses</SubTitle>
          <Autocomplete
            options={availableCommittees.filter(
              (comm) => !candidateInterests.some((ci) => ci._id === comm._id)
            )}
            getOptionLabel={(option) => option.name}
            onChange={(_, newValue) => {
              handleAddInterest(newValue);
              setAutocompleteInput("");
            }}
            inputValue={autocompleteInput}
            onInputChange={(_, newInput) => setAutocompleteInput(newInput)}
            value={null}
            renderInput={(params) => (
              <TextField {...params} label="Añadir interés" fullWidth size="medium" />
            )}
            disabled={!isEditing}
            sx={{ mb: 2 }}
          />
          <ChipContainer>
            {candidateInterests.map((interest) => (
              <InterestBadge key={interest._id} color={interest.color}>
                {interest.name}
                {isEditing && (
                  <DeleteButton
                    onClick={() => handleRemoveInterest(interest._id)}
                    iconSize={16}
                    needsConfirmation={false}
                  />
                )}
              </InterestBadge>
            ))}
          </ChipContainer>
        </div>
      </TwoColumn>

      {/* Events Section */}
      <Section>
        <SubTitle>Asistencia a Eventos</SubTitle>
        <FormGroup row={!isMobile}>
          {" "}
          {/* Use row prop conditionally */}
          <FormControlLabel
            control={
              <Checkbox
                checked={events["Welcome Meeting"] === true}
                indeterminate={events["Welcome Meeting"] === null}
                onChange={() => handleEventChange("Welcome Meeting")}
                disabled={!isEditing}
              />
            }
            label="Welcome Meeting"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={events["Welcome Days"] === true}
                indeterminate={events["Welcome Days"] === null}
                onChange={() => handleEventChange("Welcome Days")}
                disabled={!isEditing}
              />
            }
            label="Welcome Days"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={events["Integration Weekend"] === true}
                indeterminate={events["Integration Weekend"] === null}
                onChange={() => handleEventChange("Integration Weekend")}
                disabled={!isEditing}
              />
            }
            label="Integration Weekend"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={events["Plataforma Local"] === true}
                indeterminate={events["Plataforma Local"] === null}
                onChange={() => handleEventChange("Plataforma Local")}
                disabled={!isEditing}
              />
            }
            label="Plataforma Local"
          />
        </FormGroup>
      </Section>

      {!isTutor && (
        <Section>
          <SubTitle>Valoración</SubTitle>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Rating
                name="candidate-rating"
                value={rating}
                onChange={handleRatingChange}
                max={5}
                onChangeActive={(_, hover) => setHoverRating(hover)}
                sx={{
                  gap: "8px",
                  fontSize: 48,
                  color: "var(--button-primary-bg)",
                  "& .MuiRating-iconEmpty": {
                    color: "color-mix(in srgb, var(--button-primary-bg), transparent 70%)"
                  }
                }}
                getLabelText={(value) => labels[value as 1 | 2 | 3 | 4 | 5]}
              />
              <span style={{ minWidth: 90, fontWeight: 500 }}>
                {hoverRating ? labels[hoverRating] : rating ? labels[rating] : "Sin selección"}
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    overflow: "visible",
                    width: 48
                  }}
                >
                  <small style={{ color: "var(--text-secondary)" }}>
                    {labels[n as 1 | 2 | 3 | 4 | 5]}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Private Notes */}
      <Section>
        <SubTitle>Notas Privadas</SubTitle>
        <TextField
          label="Tus notas privadas sobre este candidato"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          fullWidth
          multiline
          rows={4}
          variant="outlined"
        />
        <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
          <SaveButton onClick={handleSaveNote} />
        </div>
      </Section>

      {/* Interview Comments */}
      {!isTutor && (
        <Section>
          <SubTitle>Comentarios de Entrevistas</SubTitle>
          {interviewComments.length > 0 ? (
            interviewComments.map((comment, index) => (
              <InterviewCommentItem key={index}>
                <InterviewerAvatar
                  src={comment.interviewer.image || defaultAvatar}
                  onError={(e) => (e.currentTarget.src = defaultAvatar)}
                />
                <InterviewCommentContent>
                  <InterviewerName>{comment.interviewer.name}</InterviewerName>
                  <InterviewCommentText>{comment.opinion}</InterviewCommentText>
                </InterviewCommentContent>
              </InterviewCommentItem>
            ))
          ) : (
            <p>No hay comentarios de entrevistas para este candidato.</p>
          )}
        </Section>
      )}

      {/* Form Responses */}
      {!isTutor && (
        <Section>
          <SubTitle>Respuestas a Formularios</SubTitle>
          {formResponses.length > 0 ? (
            formResponses.map((res) => (
              <FormPreview
                key={res._id}
                formStructure={res.formId.structure as unknown as string}
                responses={res.responses}
                isAccordion={true}
              />
            ))
          ) : (
            <p>No hay respuestas disponibles para este candidato.</p>
          )}
        </Section>
      )}

      {/* Feedback */}
      {!isTutor && (
        <Section>
          <SubTitle>Feedback</SubTitle>
          <FeedbackForCandidate candidateId={candidate._id}></FeedbackForCandidate>
        </Section>
      )}

      {/* Rejected Reason Modal */}
      <Modal
        isOpen={showRejectedReasonModal}
        title="Razón de Rechazo"
        onClose={!isEditing ? handleRejectedReasonCancel : undefined}
      >
        <TextField
          label="Razón de Rechazo"
          value={tempRejectedReason}
          onChange={(e) => setTempRejectedReason(e.target.value)}
          fullWidth
          multiline
          rows={4}
          placeholder="Motivo por el cual el candidato fue rechazado..."
          variant="outlined"
          disabled={!isEditing}
        />
        {isEditing && (
          <ModalButtons>
            <CancelButton onClick={handleRejectedReasonCancel} />
            <AcceptButton onClick={handleRejectedReasonSave} />
          </ModalButtons>
        )}
      </Modal>
    </Container>
  );
}
