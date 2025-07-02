'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useParams } from 'next/navigation';

import FormPreview from '../../../app/components/FormPreview';
import LoadingSpinner from '../../../app/components/loaders/LoadingSpinner';

// --- Type Definitions ---
interface Candidate {
  _id: string;
  recruitmentId: string;
  name: string;
  email: string;
  alternateEmails: string[];
  photoUrl?: string;
  active: boolean;
  appliedAt: string;
  guide?: string; // Email of the guide
  interests: string[]; // Array of interest IDs
}

interface FormQuestion {
  question: string;
  type: string;
  options?: string[];
}

interface FormSection {
  title: string;
  description?: string;
  questions: FormQuestion[];
}

interface FormStructure {
  title: string;
  description?: string;
  sections: FormSection[];
}

interface FormResponse {
  _id: string;
  formId: { _id: string; structure: FormStructure; };
  respondentEmail: string;
  responses: Map<string, string | number | boolean | object>;
  processed: boolean;
  submittedAt: string; // Changed from createdAt to submittedAt to match model
}

// --- Styled Components ---
const PageContainer = styled.div`
  padding: 20px;
`;

const Section = styled.section`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const ProfileCard = styled.div`
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
`;

const Avatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-right: 20px;
  object-fit: cover;
`;

const InfoGroup = styled.div`
  margin-bottom: 10px;
`;

const Label = styled.span`
  font-weight: bold;
  margin-right: 5px;
`;

const ItemCard = styled.div`
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FormResponseCard = styled(ItemCard)`
  background-color: #f9f9f9;
`;

// --- Component ---
  const ProfilePage: React.FC = () => {
  const params = useParams<{ id: string }>();
  const [id, setId] = useState<string | undefined>(undefined);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [editablePhotoUrl, setEditablePhotoUrl] = useState('');

  const defaultAvatar = '/default-avatar.jpg'; // Path to your default avatar

  const fetchCandidate = useCallback(async () => {
    if (!id) return; // Ensure id is defined before fetching
    const res = await fetch(`/api/candidates/${id}`);
    if (res.ok) {
      const data = await res.json();
      setCandidate(data);
      setEditablePhotoUrl(data.photoUrl || defaultAvatar);
    } else {
      console.error("Failed to fetch candidate");
    }
  }, [id, defaultAvatar]);

  const fetchFormResponses = useCallback(async () => {
    if (!id) return; // Ensure id is defined before fetching
    const res = await fetch(`/api/forms/candidate/${id}`);
    if (res.ok) {
      const data = await res.json();
      console.log("Fetched form responses data:", data);
      // Convert the plain object 'responses' back into a Map
      const processedData = data.map((item: FormResponse) => ({
        ...item,
        responses: new Map(Object.entries(item.responses || {})),
      }));
      console.log("Processed form responses data:", processedData);
      setFormResponses(processedData);
    } else {
      console.error("Failed to fetch form responses");
    }
  }, [id]);

  useEffect(() => {
    if (params?.id) {
      setId(params.id);
    }
  }, [params]);

  useEffect(() => {
    if (id) {
      fetchCandidate();
      fetchFormResponses();
    }
  }, [id, fetchCandidate, fetchFormResponses]);

  

  if (!id || !candidate) {
    return <LoadingSpinner />;
  }

  return (
    <PageContainer>
      <h1>Perfil del Candidato: {candidate.name}</h1>

      <Section>
        <SectionTitle>Información del Candidato</SectionTitle>
        <ProfileCard>
          <Avatar src={editablePhotoUrl} alt="Avatar del Candidato" onError={(e) => (e.currentTarget.src = defaultAvatar)} />
            <div>
            <InfoGroup>
              <Label>Nombre:</Label>
              <span>{candidate.name}</span>
            </InfoGroup>
            <InfoGroup>
              <Label>Correo Electrónico:</Label>
              <span>{candidate.email}</span>
            </InfoGroup>
            <InfoGroup>
              <Label>URL de la Foto:</Label>
              <span>{candidate.photoUrl || 'N/A'}</span>
            </InfoGroup>
            <InfoGroup>
              <Label>ID de Reclutamiento:</Label>
              <span>{candidate.recruitmentId}</span>
            </InfoGroup>
            <InfoGroup>
              <Label>Postulado el:</Label>
              <span>{new Date(candidate.appliedAt).toLocaleString()}</span>
            </InfoGroup>
            <InfoGroup>
              <Label>Estado:</Label>
              <span>{candidate.active ? 'Activo' : 'Inactivo'}</span>
            </InfoGroup>
            </div>
        </ProfileCard>
      </Section>

      <Section>
        <SectionTitle>Respuestas del Formulario</SectionTitle>
        {formResponses.length > 0 ? (
          formResponses.map(response => (
            <FormResponseCard key={response._id}>
              <p><strong>ID del Formulario:</strong> {response.formId._id}</p>
              <p><strong>Correo del Encuestado:</strong> {response.respondentEmail}</p>
              <p><strong>Enviado el:</strong> {new Date(response.submittedAt).toLocaleString()}</p>
              {/* Pass the formId.structure directly as it's already a JavaScript object */}
              {response.formId.structure && (
                <FormPreview formStructure={JSON.stringify(response.formId.structure)} responses={response.responses} />
              )}
            </FormResponseCard>
          ))
        ) : (
          <p>No se encontraron respuestas de formulario para este candidato.</p>
        )}
      </Section>
    </PageContainer>
  );
};

export default ProfilePage;