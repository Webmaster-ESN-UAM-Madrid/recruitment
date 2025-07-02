
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import LoadingSpinner from '../../../app/components/loaders/LoadingSpinner';

// --- Type Definitions ---
interface Incident {
  _id: string;
  type: 'ERROR' | 'WARNING';
  details: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
}

interface UnprocessedResponse {
  _id: string;
  submittedAt: string;
  // Add other response fields as necessary
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

const ItemCard = styled.div`
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: var(--border-radius-md);
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const StyledButton = styled.button`
  background-color: var(--main-color);
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

const CancelButton = styled(StyledButton)`
  background-color: #6c757d; /* Secondary button color */

  &:hover {
    background-color: #5a6268;
  }
`;

// --- Component ---
const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [unprocessed, setUnprocessed] = useState<UnprocessedResponse[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [loadingUnprocessed, setLoadingUnprocessed] = useState(true);

  const fetchIncidents = async () => {
    setLoadingIncidents(true);
    try {
      const res = await fetch('/api/incidents');
      const data = await res.json();
      setIncidents(data);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    } finally {
      setLoadingIncidents(false);
    }
  };

  const fetchUnprocessed = async () => {
    setLoadingUnprocessed(true);
    try {
      const res = await fetch('/api/forms/unprocessed');
      const data = await res.json();
      setUnprocessed(data);
    } catch (error) {
      console.error("Failed to fetch unprocessed forms:", error);
    } finally {
      setLoadingUnprocessed(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    fetchUnprocessed();
  }, []);

  const handleResolveIncident = async (incidentId: string) => {
    const res = await fetch(`/api/incidents/${incidentId}`, {
      method: 'PATCH',
    });

    if (res.ok) {
      fetchIncidents(); // Refresh incidents after resolving
    } else {
      const data = await res.json();
      alert(`Resolving incident failed: ${data.message}`);
    }
  };

  const handleDiscardIncident = async (incidentId: string) => {
    const res = await fetch(`/api/incidents/${incidentId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      fetchIncidents(); // Refresh incidents after discarding
    } else {
      const data = await res.json();
      alert(`Discarding incident failed: ${data.message}`);
    }
  };

  const handleProcessClick = async (responseId: string) => {
    const res = await fetch(`/api/forms/process/${responseId}`, {
      method: 'POST',
    });

    if (res.ok) {
      // Refresh both lists after processing
      fetchIncidents();
      fetchUnprocessed();
    } else {
      const data = await res.json();
      alert(`Processing failed: ${data.message}`);
    }
  };

  const openErrorIncidents = incidents.filter(inc => inc.type === 'ERROR' && inc.status === 'OPEN');
  const openWarningIncidents = incidents.filter(inc => inc.type === 'WARNING' && inc.status === 'OPEN');
  const resolvedIncidents = incidents.filter(inc => inc.status === 'RESOLVED');

  return (
    <PageContainer>
      <h1>Incidencias y Procesamiento</h1>
      
      <Section>
        <SectionTitle>Errores Abiertos</SectionTitle>
        {loadingIncidents ? (
          <LoadingSpinner />
        ) : openErrorIncidents.length > 0 ? (
          openErrorIncidents.map(inc => (
            <ItemCard key={inc._id}>
              <p><strong>Detalles:</strong> {inc.details}</p>
              <p><strong>Creado el:</strong> {new Date(inc.createdAt).toLocaleString()}</p>
              <StyledButton onClick={() => handleResolveIncident(inc._id)} disabled>Resolver</StyledButton>
              <CancelButton onClick={() => handleDiscardIncident(inc._id)} style={{ marginLeft: '10px' }}>Descartar</CancelButton>
            </ItemCard>
          ))
        ) : (
          <p>No hay errores abiertos para mostrar.</p>
        )}
      </Section>

      <Section>
        <SectionTitle>Advertencias Abiertas</SectionTitle>
        {loadingIncidents ? (
          <LoadingSpinner />
        ) : openWarningIncidents.length > 0 ? (
          openWarningIncidents.map(inc => (
            <ItemCard key={inc._id}>
              <p><strong>Detalles:</strong> {inc.details}</p>
              <p><strong>Creado el:</strong> {new Date(inc.createdAt).toLocaleString()}</p>
              <StyledButton onClick={() => handleResolveIncident(inc._id)} disabled>Resolver</StyledButton>
              <CancelButton onClick={() => handleDiscardIncident(inc._id)} style={{ marginLeft: '10px' }}>Descartar</CancelButton>
            </ItemCard>
          ))
        ) : (
          <p>No hay advertencias abiertas para mostrar.</p>
        )}
        </Section>

      <Section>
        <SectionTitle>Incidencias Resueltas</SectionTitle>
        {loadingIncidents ? (
          <LoadingSpinner />
        ) : resolvedIncidents.length > 0 ? (
          resolvedIncidents.map(inc => (
            <ItemCard key={inc._id}>
              <p><strong>Detalles:</strong> {inc.details}</p>
              <p><strong>Creado el:</strong> {new Date(inc.createdAt).toLocaleString()}</p>
              <p><strong>Resuelto el:</strong> {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : 'N/A'}</p>
            </ItemCard>
          ))
        ) : (
          <p>No hay incidencias resueltas para mostrar.</p>
        )}
      </Section>

      <Section>
        <SectionTitle>Formularios Sin Procesar</SectionTitle>
        {loadingUnprocessed ? (
          <LoadingSpinner />
        ) : unprocessed.length > 0 ? (
          unprocessed.map(res => (
            <ItemCard key={res._id}>
              <p>ID de Respuesta: {res._id}</p>
              <p>Enviado el: {new Date(res.submittedAt).toLocaleString()}</p>
              <StyledButton onClick={() => handleProcessClick(res._id)}>
                Procesar
              </StyledButton>
            </ItemCard>
          ))
        ) : (
          <p>No hay formularios sin procesar.</p>
        )}
      </Section>

    </PageContainer>
  );
};

export default IncidentsPage;
