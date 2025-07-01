
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

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
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ProcessButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

// --- Component ---
const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [unprocessed, setUnprocessed] = useState<UnprocessedResponse[]>([]);

  const fetchIncidents = async () => {
    const res = await fetch('/api/incidents');
    const data = await res.json();
    setIncidents(data);
  };

  const fetchUnprocessed = async () => {
    const res = await fetch('/api/forms/unprocessed');
    const data = await res.json();
    setUnprocessed(data);
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
      <h1>Incidents & Processing</h1>
      
      <Section>
        <SectionTitle>Open Errors</SectionTitle>
        {openErrorIncidents.length > 0 ? (
          openErrorIncidents.map(inc => (
            <ItemCard key={inc._id}>
              <p><strong>Details:</strong> {inc.details}</p>
              <p><strong>Created At:</strong> {new Date(inc.createdAt).toLocaleString()}</p>
              <ProcessButton onClick={() => handleResolveIncident(inc._id)} disabled>Resolve</ProcessButton>
              <ProcessButton onClick={() => handleDiscardIncident(inc._id)} style={{ marginLeft: '10px', backgroundColor: '#dc3545' }}>Discard</ProcessButton>
            </ItemCard>
          ))
        ) : (
          <p>No open errors to display.</p>
        )}
      </Section>

      <Section>
        <SectionTitle>Open Warnings</SectionTitle>
        {openWarningIncidents.length > 0 ? (
          openWarningIncidents.map(inc => (
            <ItemCard key={inc._id}>
              <p><strong>Details:</strong> {inc.details}</p>
              <p><strong>Created At:</strong> {new Date(inc.createdAt).toLocaleString()}</p>
              <ProcessButton onClick={() => handleResolveIncident(inc._id)} disabled>Resolve</ProcessButton>
              <ProcessButton onClick={() => handleDiscardIncident(inc._id)} style={{ marginLeft: '10px', backgroundColor: '#dc3545' }}>Discard</ProcessButton>
            </ItemCard>
          ))
        ) : (
          <p>No open warnings to display.</p>
        )}
        </Section>

      <Section>
        <SectionTitle>Resolved Incidents</SectionTitle>
        {resolvedIncidents.length > 0 ? (
          resolvedIncidents.map(inc => (
            <ItemCard key={inc._id}>
              <p><strong>Details:</strong> {inc.details}</p>
              <p><strong>Created At:</strong> {new Date(inc.createdAt).toLocaleString()}</p>
              <p><strong>Resolved At:</strong> {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : 'N/A'}</p>
            </ItemCard>
          ))
        ) : (
          <p>No resolved incidents to display.</p>
        )}
      </Section>

      <Section>
        <SectionTitle>Unprocessed Forms</SectionTitle>
        {unprocessed.length > 0 ? (
          unprocessed.map(res => (
            <ItemCard key={res._id}>
              <p>Response ID: {res._id}</p>
              <p>Submitted At: {new Date(res.submittedAt).toLocaleString()}</p>
              <ProcessButton onClick={() => handleProcessClick(res._id)}>
                Process
              </ProcessButton>
            </ItemCard>
          ))
        ) : (
          <p>No unprocessed forms.</p>
        )}
      </Section>

    </PageContainer>
  );
};

export default IncidentsPage;
