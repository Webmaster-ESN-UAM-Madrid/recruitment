import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import Tooltip from '@mui/material/Tooltip';

import { NextSemIcon } from '../../../app/components/icons/tags/NextSemIcon';
import { ErasmusIcon } from '../../../app/components/icons/tags/ErasmusIcon';
import { FriendIcon } from '../../../app/components/icons/tags/FriendIcon';
import { RedFlagIcon } from '../../../app/components/icons/tags/RedFlagIcon';

const availableTags = [
  { tag: 'nextSem', label: 'Próximo Cuatri', Icon: NextSemIcon },
  { tag: 'erasmus', label: 'Erasmus', Icon: ErasmusIcon },
  { tag: 'friend', label: 'Amigo', Icon: FriendIcon },
  { tag: 'redFlag', label: 'Red Flag', Icon: RedFlagIcon },
];

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
  border-bottom: 2px solid var(--border-secondary);
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const CandidateTableContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-primary);
  border-radius: 5px;
  overflow-x: auto;
`;

const TableHeader = styled.div<{ gridtemplatecolumns: string }>`
  display: grid;
  grid-template-columns: ${props => props.gridtemplatecolumns};
  padding: 10px 15px;
  background-color: var(--table-header-bg);
  font-weight: bold;
  border-bottom: 1px solid var(--border-primary);
  align-items: center;
`;

const TableRow = styled.div<{ $inactive?: boolean, gridtemplatecolumns: string }>`
  display: grid;
  grid-template-columns: ${props => props.gridtemplatecolumns};
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid var(--border-secondary);
  text-decoration: none;
  color: inherit;
  opacity: ${props => (props.$inactive ? 0.6 : 1)};
  background-color: ${props => (props.$inactive ? '#f9f9f9' : 'var(--bg-primary)')};

  &:hover {
    background-color: ${props => (props.$inactive ? '#f0f0f0' : 'var(--table-row-hover-bg)')};
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
  flex-shrink: 1;
`;

const ItemCard = styled.div`
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

interface Candidate {
  _id: string;
  name: string;
  email: string;
  photoUrl?: string;
  active: boolean;
  rejectedReason?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formResponses?: any[];
  tags?: { tag: string; comment?: string }[];
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

interface SelectableTableProps {
  title: string;
  candidates: Candidate[];
  allColumns: Column[];
  visibleColumnIds: string[];
  onColumnToggle: (columnKey: string) => void;
  storageKey: string;
  formStructure: FormSection[];
  availableCommittees: Committee[];
  loading: boolean;
  maxSelectableColumns: number;
  isInactiveTable: boolean;
}

const SelectableTable: React.FC<SelectableTableProps> = ({
  title,
  candidates,
  allColumns,
  visibleColumnIds,
  onColumnToggle,
  formStructure,
  availableCommittees,
  loading,
  maxSelectableColumns,
  isInactiveTable,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const defaultAvatar = '/default-avatar.jpg';

  let fixedColumns = allColumns.filter(c => c.fixed);
  const dynamicColumns = allColumns.filter(c => !c.fixed && visibleColumnIds.includes(c.key));

  if (isInactiveTable) {
    fixedColumns = [...fixedColumns, { key: 'rejectedReason', header: 'Motivo de Rechazo', fixed: true, width: '1fr' }];
  }

  const visibleColumns = [...fixedColumns, ...dynamicColumns];

  const gridtemplatecolumns = visibleColumns.map(c => c.width || '1fr').join(' ') + (dynamicColumns.length > 0 ? " 30px" : " 1fr 30px");

  return (
    <Section>
      <SectionTitle>{title}</SectionTitle>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Columns"
      >
        <ColumnSelector
          allColumns={allColumns}
          formStructure={formStructure}
          visibleColumnIds={visibleColumnIds}
          onColumnToggle={onColumnToggle}
          maxColumns={maxSelectableColumns}
        />
      </Modal>
      <CandidateTableContainer>
        <TableHeader gridtemplatecolumns={gridtemplatecolumns}>
          {visibleColumns.map(column => (
            <DataCell key={column.key}>
              {column.header}
              {!column.fixed && (
                <HideButton onClick={() => onColumnToggle(column.key)} iconSize={12} />
              )}
            </DataCell>
          ))}
          {dynamicColumns.length === 0 && <div />}
          <DataCell key={"add-btn"}>
            <AddButton onClick={() => setIsModalOpen(true)} iconSize={12} />
          </DataCell>
        </TableHeader>
        {loading ? (
          <LoadingSpinner />
        ) : candidates.length > 0 ? (
          candidates.map(candidate => (
            <TableRow key={candidate._id} gridtemplatecolumns={gridtemplatecolumns} $inactive={!candidate.active}>
              {visibleColumns.map(column => (
                <DataCell key={column.key}>
                  {column.key === 'tags' && (
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
                  )}
                  {column.key === 'avatar' && <Avatar src={candidate.photoUrl || defaultAvatar} onError={(e) => (e.currentTarget.src = defaultAvatar)} />}
                  {column.key === 'name' && <CandidateName href={`/profile/${candidate._id}`}>{candidate.name}</CandidateName>}
                  {column.key === 'rejectedReason' && candidate.rejectedReason}
                  {column.key !== 'tags' && column.key !== 'avatar' && column.key !== 'name' && column.key !== 'rejectedReason' && (
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
              ))}
            </TableRow>
          ))
        ) : (
          <ItemCard style={{ border: 'none', marginBottom: 0 }}>No hay candidatos para mostrar.</ItemCard>
        )}
      </CandidateTableContainer>
    </Section>
  );
};

const DashboardPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [availableCommittees, setAvailableCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [formStructure, setFormStructure] = useState<FormSection[]>([]);

  const allColumns: Column[] = [
    { key: 'tags', header: '', fixed: true, width: '40px' },
    { key: 'avatar', header: 'Foto', fixed: true, width: '60px' },
    { key: 'name', header: 'Nombre', fixed: true, width: '200px' },
    { key: 'email', header: 'Correo Electrónico', fixed: false, width: '1fr' },
    { key: 'feedback', header: 'Feedback', fixed: false, width: '130px' },
    { key: 'tutor', header: 'Tutor', fixed: false, width: '1fr' },
    { key: 'interests', header: 'Intereses', fixed: false, width: '1fr' },
    ...formStructure.flatMap(section => section.questions.map(question => ({ key: question.id.toString(), header: question.title, fixed: false, width: '1fr' }))),
  ];

  const [activeVisibleColumnIds, setActiveVisibleColumnIds] = useState<string[]>([]);
  const [inactiveVisibleColumnIds, setInactiveVisibleColumnIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [candidatesRes, formsRes, committeesRes, feedbackRes] = await Promise.all([
          fetch('/api/candidates'),
          fetch('/api/forms'),
          fetch('/api/committees'),
          fetch('/api/feedback/all'),
        ]);

        if (candidatesRes.ok) {
          const candidatesData = await candidatesRes.json();
          const allFormResponsesRes = await fetch('/api/forms/all-responses');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let allFormResponses: any[] = [];
          if (allFormResponsesRes.ok) {
            allFormResponses = await allFormResponsesRes.json();
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let allFeedback: any = {};
          if (feedbackRes.ok) {
            allFeedback = await feedbackRes.json();
          }

          const candidatesWithData = candidatesData.map((candidate: Candidate) => {
            const candidateResponses = allFormResponses.filter(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (response: any) => response.candidateId === candidate._id
            );
            const candidateFeedback = allFeedback[candidate._id] || { recruiters: [], tutor: [], volunteers: [] };
            return { ...candidate, formResponses: candidateResponses, feedback: candidateFeedback };
          });

          setCandidates(candidatesWithData);
        } else {
          console.error("Failed to fetch candidates");
        }

        if (formsRes.ok) {
          const formsData = await formsRes.json();
          if (formsData.length > 0) {
            const structure = JSON.parse(formsData[0].structure).map(([title, questions]: [string, FormQuestion[]]) => ({
              title,
              questions,
            }));
            setFormStructure(structure);

            const savedActiveColumns = localStorage.getItem('dashboardActiveVisibleColumns');
            if (savedActiveColumns) {
              try {
                const parsedColumns = JSON.parse(savedActiveColumns);
                if (Array.isArray(parsedColumns) && parsedColumns.every(item => typeof item === 'string')) {
                  setActiveVisibleColumnIds(parsedColumns.slice(0, MAX_SELECTED_COLUMNS));
                }
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (error) {
                // ignore error
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
              setActiveVisibleColumnIds(initialVisibleColumnIds);
            }
            
            const savedInactiveColumns = localStorage.getItem('dashboardInactiveVisibleColumns');
            if (savedInactiveColumns) {
              try {
                const parsedColumns = JSON.parse(savedInactiveColumns);
                if (Array.isArray(parsedColumns) && parsedColumns.every(item => typeof item === 'string')) {
                  setInactiveVisibleColumnIds(parsedColumns.slice(0, MAX_SELECTED_COLUMNS - 1));
                }
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (error) {
                // ignore error
              }
            } else {
                const initialVisibleColumnIds: string[] = ['rejectedReason']; // Add rejectedReason by default
                const initialNonFixedKeys = ['email', 'feedback', 'tutor', 'interests'];
                for (const key of initialNonFixedKeys) {
                  const column = allColumns.find(c => c.key === key);
                  if (column && initialVisibleColumnIds.length < (MAX_SELECTED_COLUMNS - 1)) {
                    initialVisibleColumnIds.push(column.key);
                  }
                }
                setInactiveVisibleColumnIds(initialVisibleColumnIds);
            }
          }
        } else {
          console.error("Failed to fetch forms");
        }

        if (committeesRes.ok) {
          const committeesData = await committeesRes.json();
          setAvailableCommittees(committeesData);
        }

      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('dashboardActiveVisibleColumns', JSON.stringify(activeVisibleColumnIds));
    }
  }, [activeVisibleColumnIds, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('dashboardInactiveVisibleColumns', JSON.stringify(inactiveVisibleColumnIds));
    }
  }, [inactiveVisibleColumnIds, loading]);

  const handleColumnToggle = (columnKey: string, tableType: 'active' | 'inactive', maxAllowedColumns: number) => {
    const column = allColumns.find(c => c.key === columnKey);
    if (!column) return;

    const visibleIds = tableType === 'active' ? activeVisibleColumnIds : inactiveVisibleColumnIds;
    const setVisibleIds = tableType === 'active' ? setActiveVisibleColumnIds : setInactiveVisibleColumnIds;

    const isVisible = visibleIds.includes(columnKey);

    if (isVisible) {
      if (!column.fixed) {
        setVisibleIds(visibleIds.filter(id => id !== columnKey));
      }
    } else {
      if (visibleIds.length < maxAllowedColumns) {
        setVisibleIds([...visibleIds, columnKey]);
      }
    }
  };

  const activeCandidates = candidates.filter(c => c.active);
  const inactiveCandidates = candidates.filter(c => !c.active);

  return (
    <PageContainer>
      <h1>Dashboard</h1>
      <SelectableTable
        title="Candidatos Activos"
        candidates={activeCandidates}
        allColumns={allColumns}
        visibleColumnIds={activeVisibleColumnIds}
        onColumnToggle={(key) => handleColumnToggle(key, 'active', MAX_SELECTED_COLUMNS)}
        storageKey="dashboardActiveVisibleColumns"
        formStructure={formStructure}
        availableCommittees={availableCommittees}
        loading={loading}
        maxSelectableColumns={MAX_SELECTED_COLUMNS}
        isInactiveTable={false}
      />
      <SelectableTable
        title="Candidatos Inactivos"
        candidates={inactiveCandidates}
        allColumns={allColumns}
        visibleColumnIds={inactiveVisibleColumnIds}
        onColumnToggle={(key) => handleColumnToggle(key, 'inactive', MAX_SELECTED_COLUMNS - 1)}
        storageKey="dashboardInactiveVisibleColumns"
        formStructure={formStructure}
        availableCommittees={availableCommittees}
        loading={loading}
        maxSelectableColumns={MAX_SELECTED_COLUMNS - 1}
        isInactiveTable={true}
      />
    </PageContainer>
  );
};

export default DashboardPage;
