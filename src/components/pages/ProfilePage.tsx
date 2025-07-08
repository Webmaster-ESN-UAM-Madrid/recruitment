'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useParams } from 'next/navigation';
import { TextField, Autocomplete, Switch } from '@mui/material';

import { AddButton } from '../../../app/components/buttons/AddButton';
import { SaveButton } from '../../../app/components/buttons/SaveButton';
import { EditButton } from '../../../app/components/buttons/EditButton';
import { CancelButton } from '../../../app/components/buttons/CancelButton';
import { DeleteButton } from '../../../app/components/buttons/DeleteButton';
import { useToast } from '../../../app/components/toasts/ToastContext';
import FormPreview from '../../../app/components/FormPreview';
import { FormStructure } from '@/lib/types/form';
import FeedbackForCandidate from '@/app/components/FeedbackForCandidate';

interface User {
  id: string;
  name: string;
  email: string;
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
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
`;

const ProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
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
`;

const LabelGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Label = styled.span`
  font-weight: 600;
`;

const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
`;

const EmailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const ChipContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Section = styled.div`
  margin-bottom: 40px;
`;

const SubTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 16px;
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

export default function ProfilePage() {
  const params = useParams();
  const id = params && 'id' in params ? (params.id as string) : undefined;
  const { addToast } = useToast();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [availableCommittees, setAvailableCommittees] = useState<Committee[]>([]);
  const [candidateInterests, setCandidateInterests] = useState<Committee[]>([]);
  const [autocompleteInput, setAutocompleteInput] = useState('');

  const defaultAvatar = '/default-avatar.jpg';

  const fetchCommittees = useCallback(async () => {
    try {
      const res = await fetch('/api/committees');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAvailableCommittees(data);
    } catch (err) {
      console.error('Error fetching committees', err);
      addToast('Error al cargar los comités.', 'error');
    }
  }, [addToast]);

  const fetchCandidate = useCallback(async (candidateId: string) => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCandidate(data);

      // Map interest ObjectIds to full Committee objects
      if (availableCommittees.length > 0 && data.interests) {
        const interestsWithDetails = data.interests
          .map((interestId: string) =>
            availableCommittees.find((comm) => comm._id === interestId)
          )
          .filter(Boolean) as Committee[];
        setCandidateInterests(interestsWithDetails);
      }
    } catch {
      addToast('Error al cargar el perfil del candidato.', 'error');
    }
  }, [addToast, availableCommittees]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.filter((user: User) => user.email.endsWith('@esnuam.org')));
    } catch (err) {
      console.error('No se pudieron cargar los usuarios', err);
    }
  }, []);

  const fetchFormResponses = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/forms/candidate/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const processed = data.map((item: FormResponse) => ({
        ...item,
        responses: new Map(Object.entries(item.responses || {})),
      }));
      setFormResponses(processed);
    } catch (err) {
      console.error('Error al obtener respuestas del formulario', err);
    }
  }, [id]);

  useEffect(() => {
    fetchCommittees();
  }, [fetchCommittees]);

  useEffect(() => {
    if (id) {
      fetchCandidate(id);
      fetchUsers();
      fetchFormResponses();
    }
  }, [id, fetchCandidate, fetchUsers, fetchFormResponses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (candidate) {
      setCandidate({ ...candidate, [e.target.name]: e.target.value });
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    if (candidate) {
      const newEmails = [...candidate.alternateEmails];
      newEmails[index] = value;
      setCandidate({ ...candidate, alternateEmails: newEmails });
    }
  };

  const addEmail = () => {
    if (candidate) {
      setCandidate({ ...candidate, alternateEmails: [...candidate.alternateEmails, ''] });
    }
  };

  const removeEmail = (index: number) => {
    if (candidate) {
      const updated = candidate.alternateEmails.filter((_, i) => i !== index);
      setCandidate({ ...candidate, alternateEmails: updated });
    }
  };

  const handleAddInterest = (committee: Committee | null) => {
    if (candidate && committee && !candidateInterests.some(i => i._id === committee._id)) {
      setCandidateInterests([...candidateInterests, committee]);
    }
  };

  const handleRemoveInterest = (interestId: string) => {
    if (candidate) {
      setCandidateInterests(candidateInterests.filter(i => i._id !== interestId));
    }
  };

  const handleSave = async () => {
    if (!candidate) return;
    try {
      const sanitizedMainEmail = candidate.email.trim().toLowerCase();
      if (!isValidEmail(sanitizedMainEmail)) {
        addToast(`Correo principal inválido: ${sanitizedMainEmail}`, 'error');
        return;
      }

      const cleanedAlternateEmails = candidate.alternateEmails
        .map(email => email.trim().toLowerCase())
        .filter(email => email !== '');

      for (const email of cleanedAlternateEmails) {
        if (!isValidEmail(email)) {
          addToast(`Correo alternativo inválido: ${email}`, 'error');
          return;
        }
      }

      const updatedCandidate = {
        ...candidate,
        email: sanitizedMainEmail,
        tutor: candidate.tutor,
        alternateEmails: cleanedAlternateEmails,
        interests: candidateInterests.map(i => i._id),
      };

      const res = await fetch(`/api/candidates/${candidate._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCandidate),
      });
      if (!res.ok) throw new Error();
      setIsEditing(false);
      setCandidate(updatedCandidate);
      addToast('Perfil actualizado con éxito', 'success');
    } catch {
      addToast('Error al actualizar el perfil', 'error');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (id) fetchCandidate(id);
  };

  if (!candidate) return <div>Cargando...</div>;

  console.log(formResponses)

  return (
    <Container>
      <Title>Perfil del Candidato</Title>

      <Header>
        <ProfileCard>
          <Avatar
            src={candidate.photoUrl || defaultAvatar}
            alt="Foto del candidato"
            onError={(e) => (e.currentTarget.src = defaultAvatar)}
          />
          <InfoGroup>
            <LabelGroup><Label>Nombre:</Label> {candidate.name}</LabelGroup>
            <LabelGroup><Label>Correo principal:</Label> {candidate.email}</LabelGroup>
            <LabelGroup><Label>Padrino:</Label> {candidate.tutor || 'Ninguno'}</LabelGroup>
            
            <ToggleGroup>
              <Label style={{ marginBottom: 0, userSelect: 'none' }}>
                Activo:
              </Label>
              <div style={{ marginTop: -2 }}>
                <Switch
                  id="status-toggle"
                  checked={candidate.active ?? true}
                  disabled={!isEditing}
                  onChange={(e) => {
                    if (candidate) setCandidate({ ...candidate, active: e.target.checked });
                  }}
                  size="small"
                /> 
              </div>
            </ToggleGroup>
          </InfoGroup>
        </ProfileCard>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          {isEditing ? (
            <>
              <SaveButton onClick={handleSave} />
              <CancelButton onClick={handleCancel} />
            </>
          ) : (
            <EditButton onClick={() => setIsEditing(true)} />
          )}
        </div>
      </Header>

      {/* Photo URL Field (full width) */}
      <TextField
        label="URL de Foto"
        name="photoUrl"
        value={candidate.photoUrl || ''}
        onChange={handleInputChange}
        disabled={!isEditing}
        fullWidth
        style={{ marginBottom: 32 }}
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
          onChange={(_, newValue) =>
            setCandidate({ ...candidate, tutor: newValue || '' })
          }
          onInputChange={(_, newInput) =>
            setCandidate({ ...candidate, tutor: newInput })
          }
          renderInput={(params) => (
            <TextField {...params} label="Padrino" disabled={!isEditing} />
          )}
          disabled={!isEditing}
        />
      </TwoColumn>

      {/* Emails | Interests */}
      <TwoColumn>
        <div>
          <SubTitle>Correos electrónicos</SubTitle>
          <EmailRow>
            <TextField
              label="Correo principal"
              value={candidate.email}
              onChange={(e) =>
                setCandidate({ ...candidate, email: e.target.value })
              }
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
              setAutocompleteInput('');
            }}
            inputValue={autocompleteInput}
            onInputChange={(_, newInput) => setAutocompleteInput(newInput)}
            value={null}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Añadir interés"
                fullWidth
                size="medium"
              />
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
                  />
                )}
              </InterestBadge>
            ))}
          </ChipContainer>
        </div>
      </TwoColumn>

      {/* Form Responses */}
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

      {/* Feedback */}
      <Section>
        <SubTitle>Feedback</SubTitle>
        <FeedbackForCandidate candidateId={candidate._id}></FeedbackForCandidate>
      </Section>
    </Container>
  );
}
