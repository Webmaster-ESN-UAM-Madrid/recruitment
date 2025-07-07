import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Link from 'next/link';

import { AddButton } from '@/app/components/buttons/AddButton';
import { HideButton } from '@/app/components/buttons/HideButton';
import LoadingSpinner from '@/app/components/loaders/LoadingSpinner';
import DashboardItem from '@/app/components/dashboard/DashboardItem';
import Modal from '@/app/components/modals/Modal';
import ColumnSelector from '@/app/components/dashboard/ColumnSelector';

const MAX_SELECTED_COLUMNS = 4;

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
  overflow-x: auto;
`;

const TableHeader = styled.div<{ gridtemplatecolumns: string }>`
  display: grid;
  grid-template-columns: ${props => props.gridtemplatecolumns};
  padding: 10px 15px;
  background-color: #f0f0f0;
  font-weight: bold;
  border-bottom: 1px solid #ddd;
  align-items: center;
`;

const TableRow = styled.div<{ $inactive?: boolean, gridtemplatecolumns: string }>`
  display: grid;
  grid-template-columns: ${props => props.gridtemplatecolumns};
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

const CandidateName = styled(Link)`
  font-weight: bold;
  color: #007bff;
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
  flex-shrink: 1;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formResponses?: any[]; // Add formResponses property
}

interface FormQuestion {
  id: number;
  title: string;
  description: string;
  type: string;
  required: boolean;
  options?: string[];
  rows?: string[];
  columns?: string[];
}

interface FormSection {
  title: string;
  questions: FormQuestion[];
}

interface Committee {
  _id: string;
  name: string;
  color: string;
}



interface Column {
  key: string;
  header: string;
  fixed: boolean;
  width: string;
}

const DashboardPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [availableCommittees, setAvailableCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const defaultAvatar = '/default-avatar.jpg';

  const [formStructure, setFormStructure] = useState<FormSection[]>([]);

  const allColumns: Column[] = [
    { key: 'tags', header: '', fixed: true, width: '30px' },
    { key: 'avatar', header: 'Foto', fixed: true, width: '60px' },
    { key: 'name', header: 'Nombre', fixed: true, width: '200px' },
    { key: 'email', header: 'Correo Electrónico', fixed: false, width: '1fr' },
    { key: 'feedback', header: 'Feedback', fixed: false, width: '130px' },
    { key: 'tutor', header: 'Tutor', fixed: false, width: '1fr' },
    { key: 'interests', header: 'Intereses', fixed: false, width: '1fr' },
    ...formStructure.flatMap(section => section.questions.map(question => ({ key: question.id.toString(), header: question.title, fixed: false, width: '1fr' }))),
  ];

  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [candidatesRes, formsRes, committeesRes] = await Promise.all([
          fetch('/api/candidates'),
          fetch('/api/forms'),
          fetch('/api/committees'),
        ]);

        if (candidatesRes.ok) {
          const candidatesData = await candidatesRes.json();
          // Fetch form responses for each candidate
          const allFormResponsesRes = await fetch('/api/forms/all-responses');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let allFormResponses: any[] = [];
          if (allFormResponsesRes.ok) {
            allFormResponses = await allFormResponsesRes.json();
          } else {
            console.error("Failed to fetch all form responses");
          }

          const candidatesWithResponses = candidatesData.map((candidate: Candidate) => {
            const candidateResponses = allFormResponses.filter(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (response: any) => response.candidateId === candidate._id
            );
            return { ...candidate, formResponses: candidateResponses };
          });
          setCandidates(candidatesWithResponses);
        } else {
          console.error("Failed to fetch candidates");
        }

        if (formsRes.ok) {
          const formsData = await formsRes.json();
          // Assuming the first form in the array is the one we care about for structure
          if (formsData.length > 0) {
            const structure = JSON.parse(formsData[0].structure).map(([title, questions]: [string, FormQuestion[]]) => ({
              title,
              questions,
            }));
            setFormStructure(structure);

            // Load from localStorage or set initial default columns
            const savedColumns = localStorage.getItem('dashboardVisibleColumns');
            if (savedColumns) {
              try {
                const parsedColumns = JSON.parse(savedColumns);
                if (Array.isArray(parsedColumns) && parsedColumns.every(item => typeof item === 'string')) {
                  setVisibleColumnIds(parsedColumns.slice(0, MAX_SELECTED_COLUMNS));
                } else {
                  console.warn("Invalid data in localStorage for dashboardVisibleColumns, using defaults.");
                  const initialVisibleColumnIds: string[] = [];
                  const initialNonFixedKeys = ['email', 'feedback', 'tutor', 'interests'];
                  for (const key of initialNonFixedKeys) {
                    const column = allColumns.find(c => c.key === key);
                    if (column && initialVisibleColumnIds.length < MAX_SELECTED_COLUMNS) {
                      initialVisibleColumnIds.push(column.key);
                    }
                  }
                  setVisibleColumnIds(initialVisibleColumnIds);
                }
              } catch (e) {
                console.error("Error parsing dashboardVisibleColumns from localStorage:", e);
                const initialVisibleColumnIds: string[] = [];
                const initialNonFixedKeys = ['email', 'feedback', 'tutor', 'interests'];
                for (const key of initialNonFixedKeys) {
                  const column = allColumns.find(c => c.key === key);
                  if (column && initialVisibleColumnIds.length < MAX_SELECTED_COLUMNS) {
                    initialVisibleColumnIds.push(column.key);
                  }
                }
                setVisibleColumnIds(initialVisibleColumnIds);
              }
            } else {
              const initialVisibleColumnIds: string[] = [];
              const initialNonFixedKeys = ['email', 'feedback', 'tutor', 'interests'];
              for (const key of initialNonFixedKeys) {
                const column = allColumns.find(c => c.key === key);
                if (column && initialVisibleColumnIds.length < MAX_SELECTED_COLUMNS) {
                  initialVisibleColumnIds.push(column.key);
                }
              }
              setVisibleColumnIds(initialVisibleColumnIds);
            }
          }
        } else {
          console.error("Failed to fetch forms");
        }

        if (committeesRes.ok) {
          const committeesData = await committeesRes.json();
          setAvailableCommittees(committeesData);
        } else {
          console.error("Failed to fetch committees");
        }

      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Save visibleColumnIds to localStorage whenever it changes
  useEffect(() => {
    if (visibleColumnIds.length > 0) { // Only save if there are columns to save
      localStorage.setItem('dashboardVisibleColumns', JSON.stringify(visibleColumnIds));
    }
  }, [visibleColumnIds]);

  const handleColumnToggle = (columnKey: string) => {
    const column = allColumns.find(c => c.key === columnKey);
    if (!column) return;

    const isVisible = visibleColumnIds.includes(columnKey);

    if (isVisible) {
      if (!column.fixed) {
        setVisibleColumnIds(visibleColumnIds.filter(id => id !== columnKey));
      }
    } else {
      if (visibleColumnIds.length < MAX_SELECTED_COLUMNS) {
        setVisibleColumnIds([...visibleColumnIds, columnKey]);
      }
    }
  };

  const fixedColumns = allColumns.filter(c => c.fixed);
  const dynamicColumns = allColumns.filter(c => !c.fixed && visibleColumnIds.includes(c.key));
  const visibleColumns = [...fixedColumns, ...dynamicColumns];

  const gridtemplatecolumns = visibleColumns.map(c => c.width || '1fr').join(' ') + (dynamicColumns.length > 0 ? " 30px" : " 1fr 30px");

  const activeCandidates = candidates.filter(c => c.active);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const inactiveCandidates = candidates.filter(c => !c.active);

  return (
    <PageContainer>
      <h1>Dashboard</h1>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Columns"
      >
        <ColumnSelector
          allColumns={allColumns}
          formStructure={formStructure}
          visibleColumnIds={visibleColumnIds}
          onColumnToggle={handleColumnToggle}
          maxColumns={MAX_SELECTED_COLUMNS}
        />
      </Modal>

      <Section>
        <SectionTitle>Candidatos Activos</SectionTitle>
        <CandidateTable>
          <TableHeader gridtemplatecolumns={gridtemplatecolumns}>
            {visibleColumns.map(column => {
              return (
                <DataCell key={column.key}>
                  {column.header}
                  {!column.fixed && (
                    <HideButton onClick={() => handleColumnToggle(column.key)} iconSize={12} />
                  )}
                </DataCell>
              );
            })}
            {dynamicColumns.length === 0 && <div />}
            <DataCell key={"add-btn"}>
              <AddButton onClick={() => setIsModalOpen(true)} iconSize={12} />
            </DataCell>
          </TableHeader>
          {loading ? (
            <LoadingSpinner />
          ) : activeCandidates.length > 0 ? (
            activeCandidates.map(candidate => (
              <TableRow key={candidate._id} gridtemplatecolumns={gridtemplatecolumns}>
                {visibleColumns.map(column => {
                  return (
                    <DataCell key={column.key}>
                      {column.key === 'tags' && <div />}
                      {column.key === 'avatar' && <Avatar src={candidate.photoUrl || defaultAvatar} onError={(e) => (e.currentTarget.src = defaultAvatar)} />}
                      {column.key === 'name' && <CandidateName href={`/profile/${candidate._id}`}>{candidate.name}</CandidateName>}
                      {column.key !== 'tags' && column.key !== 'avatar' && column.key !== 'name' && (
                        <DashboardItem
                          candidate={candidate}
                          data={candidate[column.key]}
                          columnKey={column.key}
                          formResponses={candidate.formResponses}
                          gridTemplateColumns={gridtemplatecolumns}
                          question={(() => {
                            if (!isNaN(Number(column.key))) {
                              for (const section of formStructure) {
                                for (const question of section.questions) {
                                  if (question.id.toString() === column.key) {
                                    return question;
                                  }
                                }
                              }
                            }
                            return undefined;
                          })()}
                          availableCommittees={availableCommittees}
                        />
                      )}
                    </DataCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <ItemCard>No hay candidatos activos para mostrar.</ItemCard>
          )}
        </CandidateTable>
      </Section>

      {/* <Section>
        <SectionTitle>Candidatos Inactivos</SectionTitle>
        <CandidateTable>
          <TableHeader gridtemplatecolumns={gridtemplatecolumns}>
            {visibleColumnIds.map(columnId => {
              const column = allColumns.find(c => c.key === columnId.toString());
              if (!column) return null;
              return (
                <DataCell key={column.key}>
                  {column.header}
                </DataCell>
              );
            })}
          </TableHeader>
          {loading ? (
            <LoadingSpinner />
          ) : inactiveCandidates.length > 0 ? (
            inactiveCandidates.map(candidate => (
              <TableRow key={candidate._id} $inactive gridtemplatecolumns={gridtemplatecolumns}>
                {visibleColumns.map(column => {
                  return (
                    <DataCell key={column.key}>
                      {column.key === 'tags' && <div />}
                      {column.key === 'avatar' && <Avatar src={candidate.photoUrl || defaultAvatar} onError={(e) => (e.currentTarget.src = defaultAvatar)} />}
                      {column.key === 'name' && <CandidateName href={`/profile/${candidate._id}`}>{candidate.name}</CandidateName>}
                      {column.key !== 'tags' && column.key !== 'avatar' && column.key !== 'name' && <DashboardItem candidate={candidate} data={candidate[column.key]} columnKey={column.key} formResponses={candidate.formResponses} gridTemplateColumns={gridtemplatecolumns} />}
                    </DataCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <ItemCard>No hay candidatos inactivos para mostrar.</ItemCard>
          )}
        </CandidateTable>
      </Section> */}
    </PageContainer>
  );
};

export default DashboardPage;