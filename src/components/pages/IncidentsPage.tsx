"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { IFormResponse } from "@/lib/models/formResponse";
import LoadingSpinner from "@/src/components/loaders/LoadingSpinner";
import FormPreview from "@/src/components/FormPreview";
import AttachToCandidateModal from "@/src/components/modals/AttachToCandidateModal";
import { EditButton } from "@/src/components/buttons/EditButton";
import { DeleteButton } from "@/src/components/buttons/DeleteButton";
import { IForm } from "@/lib/models/form";
import Modal from "@/src/components/modals/Modal";
import { AcceptButton } from "@/src/components/buttons/AcceptButton";
import { useToast } from "@/src/components/toasts/ToastContext";
import { CancelButton } from "@/src/components/buttons/CancelButton";
import { CreateCandidateButton } from "@/src/components/buttons/CreateCandidateButton";

const PageContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  padding: 32px;
  max-width: 1000px;
  width: 100%;

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const SectionTitle = styled.h2`
  border-bottom: 2px solid var(--border-secondary);
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const IncidentCard = styled.div`
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const IncidentHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr auto; /* One column for info, auto for actions */
  gap: 10px; /* Space between columns */
  align-items: center;
  margin-bottom: 10px;
`;

const IncidentInfo = styled.div`
  display: flex;
  flex-direction: column; /* Stack date and email vertically */
  gap: 5px; /* Smaller gap between date and email */

  span {
    white-space: normal; /* Allow text to wrap */
  }
`;

const IncidentActions = styled.div`
  display: flex;
  gap: 10px;
`;

const IncidentCardTitle = styled.h3`
  margin: 0;
  font-size: 1.1em;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const IncidentsPage: React.FC = () => {
  const [unprocessedResponses, setUnprocessedResponses] = useState<IFormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [emailConfirmation, setEmailConfirmation] = useState<{
    candidateId: string;
    email: string;
  } | null>(null);
  const { addToast } = useToast();

  const fetchUnprocessedResponses = () => {
    setLoading(true);
    fetch("/api/forms/unprocessed")
      .then((res) => res.json())
      .then((data) => {
        setUnprocessedResponses(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUnprocessedResponses();
  }, []);

  const handleAttach = async (candidateId: string) => {
    if (selectedResponse) {
      const res = await fetch("/api/forms/attach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ responseId: selectedResponse, candidateId })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.needsEmailConfirmation) {
          setEmailConfirmation({ candidateId, email: data.respondentEmail });
        } else {
          addToast("Respuesta vinculada correctamente", "success");
          fetchUnprocessedResponses();
          window.dispatchEvent(new CustomEvent("updateIncidentsDot"));
        }
      } else {
        addToast("Error al vincular la respuesta", "error");
      }
      setSelectedResponse(null);
    }
  };

  const handleEmailConfirmation = async (addEmail: boolean) => {
    if (emailConfirmation && addEmail) {
      const res = await fetch(`/api/candidates/${emailConfirmation.candidateId}/add-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: emailConfirmation.email })
      });

      if (res.ok) {
        addToast("Email añadido correctamente", "success");
      } else {
        addToast("Error al añadir el email", "error");
      }
    }
    setEmailConfirmation(null);
    fetchUnprocessedResponses();
  };

  const handleDeleteFormResponse = async (responseId: string) => {
    try {
      const res = await fetch(`/api/forms/delete-response/${responseId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        addToast("Respuesta eliminada correctamente", "success");
        fetchUnprocessedResponses();
        window.dispatchEvent(new CustomEvent("updateIncidentsDot"));
      } else {
        addToast("No se pudo eliminar la respuesta", "error");
      }
    } catch (error) {
      console.error("Failed to delete form response:", error);
      addToast("Error al eliminar la respuesta", "error");
    }
  };

  const handleCreateCandidate = async (responseId: string) => {
    try {
      const res = await fetch("/api/forms/create-candidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ responseId })
      });

      if (res.ok) {
        addToast("Candidato creado correctamente", "success");
        fetchUnprocessedResponses();
        window.dispatchEvent(new CustomEvent("updateIncidentsDot"));
      } else {
        const data = await res.json();
        addToast(data.message || "Error al crear el candidato", "error");
      }
    } catch (error) {
      console.error("Failed to create candidate:", error);
      addToast("Error al crear el candidato", "error");
    }
  };

  const openErrors = unprocessedResponses.filter(
    (response) => (response.formId as IForm).canCreateUsers
  );
  const openWarnings = unprocessedResponses.filter(
    (response) => !(response.formId as IForm).canCreateUsers
  );

  return (
    <PageContainer>
      <Container>
        <SectionTitle>Errores Abiertos</SectionTitle>
        {loading ? (
          <LoadingSpinner />
        ) : (
          openErrors.map((response) => (
            <IncidentCard key={response._id as string}>
              <IncidentCardTitle>Form Sin Procesar</IncidentCardTitle>
              <IncidentHeader>
                <IncidentInfo>
                  <span>
                    <strong>Fecha:</strong> {new Date(response.submittedAt).toLocaleString()}
                  </span>
                  {response.respondentEmail && (
                    <span>
                      <strong>Email:</strong> {response.respondentEmail}
                    </span>
                  )}
                </IncidentInfo>
                <IncidentActions>
                  <CreateCandidateButton
                    onClick={() => handleCreateCandidate(response._id as string)}
                    showSpinner={true}
                    needsConfirmation={true}
                    confirmationDuration={2000}
                    ariaLabel="Crear Candidato"
                  />
                  <EditButton
                    key={`edit-${response._id}`}
                    onClick={() => setSelectedResponse(response._id as string)}
                  />
                  <DeleteButton
                    key={`delete-${response._id}`}
                    onClick={() => handleDeleteFormResponse(response._id as string)}
                    showSpinner={true}
                    needsConfirmation={true}
                    confirmationDuration={2000}
                  />
                </IncidentActions>
              </IncidentHeader>
              <FormPreview
                formStructure={(response.formId as IForm).structure}
                responses={new Map(Object.entries(response.responses))}
                isAccordion={true}
                startsExpanded={false}
              />
            </IncidentCard>
          ))
        )}

        <SectionTitle>Incidencias Abiertas</SectionTitle>
        {loading ? (
          <LoadingSpinner />
        ) : (
          openWarnings.map((response) => (
            <IncidentCard key={response._id as string}>
              <IncidentCardTitle>Form Sin Procesar</IncidentCardTitle>
              <IncidentHeader>
                <IncidentInfo>
                  <span>
                    <strong>Fecha:</strong> {new Date(response.submittedAt).toLocaleString()}
                  </span>
                  {response.respondentEmail && (
                    <span>
                      <strong>Email:</strong> {response.respondentEmail}
                    </span>
                  )}
                </IncidentInfo>
                <IncidentActions>
                  <EditButton onClick={() => setSelectedResponse(response._id as string)} />
                  <DeleteButton
                    onClick={() => handleDeleteFormResponse(response._id as string)}
                    showSpinner={true}
                    needsConfirmation={true}
                    confirmationDuration={2000}
                  />
                </IncidentActions>
              </IncidentHeader>
              <FormPreview
                formStructure={(response.formId as IForm).structure}
                responses={new Map(Object.entries(response.responses))}
                isAccordion={true}
                startsExpanded={false}
              />
            </IncidentCard>
          ))
        )}

        {selectedResponse && (
          <AttachToCandidateModal
            isOpen={!!selectedResponse}
            onClose={() => setSelectedResponse(null)}
            onAttach={handleAttach}
          />
        )}

        {emailConfirmation && (
          <Modal isOpen={!!emailConfirmation} title="Añadir Email Alternativo">
            <p>
              ¿Quieres añadir {emailConfirmation.email} a los correos electrónicos alternativos del
              candidato?
            </p>
            <ButtonContainer>
              <AcceptButton
                onClick={() => handleEmailConfirmation(true)}
                showSpinner={true}
              ></AcceptButton>
              <CancelButton onClick={() => handleEmailConfirmation(false)}></CancelButton>
            </ButtonContainer>
          </Modal>
        )}
      </Container>
    </PageContainer>
  );
};

export default IncidentsPage;
