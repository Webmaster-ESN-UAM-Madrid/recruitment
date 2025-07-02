
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Link from 'next/link';

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

const CandidateTable = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 5px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 60px 200px 1fr 120px;
  padding: 10px 15px;
  background-color: #f0f0f0;
  font-weight: bold;
  border-bottom: 1px solid #ddd;
`;

const TableRow = styled(Link)<{ $inactive?: boolean }>`
  display: grid;
  grid-template-columns: 60px 200px 1fr 120px;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  text-decoration: none;
  color: inherit;
  opacity: ${props => (props.$inactive ? 0.6 : 1)};
  background-color: ${props => (props.$inactive ? '#f9f9f9' : '#fff')};

  &:hover {
    background-color: ${props => (props.$inactive ? '#f0f0f0' : '#e9e9e9')};
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
  color: #007bff;
  &:hover {
    text-decoration: underline;
  }
`;

const DataCell = styled.div`
  padding: 0 10px;
`;

const ActionsCell = styled.div`
  display: flex;
  gap: 5px;
  justify-content: flex-end;
`;

const ItemCard = styled.div`
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

interface Candidate {
  _id: string;
  name: string;
  email: string;
  photoUrl?: string;
  active: boolean;
  // Add other properties as needed for arbitrary data
}

import LoadingSpinner from '../../../app/components/loaders/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const defaultAvatar = '/default-avatar.jpg';

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true); // Set loading to true before fetching
      try {
        const res = await fetch('/api/candidates'); // Assuming an API endpoint for all candidates
        if (res.ok) {
          const data = await res.json();
          setCandidates(data);
        } else {
          console.error("Failed to fetch candidates");
        }
      } catch (error) {
        console.error("Failed to fetch candidates:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const activeCandidates = candidates.filter(c => c.active);
  const inactiveCandidates = candidates.filter(c => !c.active);

  return (
    <PageContainer>
      <h1>Dashboard</h1>

      <Section>
        <SectionTitle>Candidatos Activos</SectionTitle>
        <CandidateTable>
          <TableHeader>
            <DataCell>Foto</DataCell>
            <DataCell>Nombre</DataCell>
            <DataCell>Correo Electrónico</DataCell>
            <DataCell>Acciones</DataCell>
          </TableHeader>
          {loading ? (
            <LoadingSpinner />
          ) : activeCandidates.length > 0 ? (
            activeCandidates.map(candidate => (
              <TableRow key={candidate._id} href={`/profile/${candidate._id}`}>
                <DataCell>
                  <Avatar src={candidate.photoUrl || defaultAvatar} onError={(e) => (e.currentTarget.src = defaultAvatar)} />
                </DataCell>
                <DataCell>
                  <CandidateName>{candidate.name}</CandidateName>
                </DataCell>
                <DataCell>{candidate.email}</DataCell>
                <ActionsCell>
                  {/* Add more actions here if needed */}
                  <span>Ver Perfil</span>
                </ActionsCell>
              </TableRow>
            ))
          ) : (
            <ItemCard>No hay candidatos activos para mostrar.</ItemCard>
          )}
        </CandidateTable>
      </Section>

      <Section>
        <SectionTitle>Candidatos Inactivos</SectionTitle>
        <CandidateTable>
          <TableHeader>
            <DataCell>Foto</DataCell>
            <DataCell>Nombre</DataCell>
            <DataCell>Correo Electrónico</DataCell>
            <DataCell>Acciones</DataCell>
          </TableHeader>
          {loading ? (
            <LoadingSpinner />
          ) : inactiveCandidates.length > 0 ? (
            inactiveCandidates.map(candidate => (
              <TableRow key={candidate._id} href={`/profile/${candidate._id}`} $inactive>
                <DataCell>
                  <Avatar src={candidate.photoUrl || defaultAvatar} onError={(e) => (e.currentTarget.src = defaultAvatar)} />
                </DataCell>
                <DataCell>
                  <CandidateName>{candidate.name}</CandidateName>
                </DataCell>
                <DataCell>{candidate.email}</DataCell>
                <ActionsCell>
                  {/* Add more actions here if needed */}
                  <span>Ver Perfil</span>
                </ActionsCell>
              </TableRow>
            ))
          ) : (
            <ItemCard>No hay candidatos inactivos para mostrar.</ItemCard>
          )}
        </CandidateTable>
      </Section>
    </PageContainer>
  );
};

export default DashboardPage;
