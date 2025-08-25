import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import Link from "next/link";
import Tooltip from "@mui/material/Tooltip";

import { NextSemIcon } from "../../../app/components/icons/tags/NextSemIcon";
import { ErasmusIcon } from "../../../app/components/icons/tags/ErasmusIcon";
import { FriendIcon } from "../../../app/components/icons/tags/FriendIcon";
import { RedFlagIcon } from "../../../app/components/icons/tags/RedFlagIcon";

const availableTags = [
    { tag: "nextSem", label: "Próximo Cuatri", Icon: NextSemIcon },
    { tag: "erasmus", label: "Erasmus", Icon: ErasmusIcon },
    { tag: "friend", label: "Amigo", Icon: FriendIcon },
    { tag: "redFlag", label: "Red Flag", Icon: RedFlagIcon }
];

import { AddButton } from "@/app/components/buttons/AddButton";
import { HideButton } from "@/app/components/buttons/HideButton";
import { UpButton } from "@/app/components/buttons/UpButton";
import { ResetButton } from "@/app/components/buttons/ResetButton";
import { DownButton } from "@/app/components/buttons/DownButton";
import LoadingSpinner from "@/app/components/loaders/LoadingSpinner";
import DashboardItem from "@/app/components/dashboard/DashboardItem";
import Modal from "@/app/components/modals/Modal";
import ColumnSelector from "@/app/components/dashboard/ColumnSelector";

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

const TableHeader = styled.div<{ gridtemplatecolumns: string; $isMobile: boolean }>`
    display: grid;
    grid-template-columns: ${(props) => props.gridtemplatecolumns};
    padding: 10px 15px;
    background-color: var(--table-header-bg);
    font-weight: bold;
    border-bottom: 1px solid var(--border-primary);
    align-items: center;
`;

const TableRow = styled.div<{ $inactive?: boolean; gridtemplatecolumns: string; $isMobile: boolean; $isDifferentPhase?: boolean }>`
    display: grid;
    grid-template-columns: ${(props) => props.gridtemplatecolumns};
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid var(--border-secondary);
    text-decoration: none;
    color: inherit;
    opacity: ${(props) => (props.$inactive ? 0.6 : 1)};
    background-color: ${(props) => (props.$inactive ? "#f9f9f9" : props.$isDifferentPhase ? "var(--table-different-phase-row-bg)" : "var(--bg-primary)")};

    &:hover {
        background-color: ${(props) => (props.$inactive ? "#f0f0f0" : "var(--table-row-hover-bg)")};
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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    recruitmentPhase?: string;
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
    isMobile: boolean; // Added isMobile prop
    currentPhase: string;
}

const SelectableTable: React.FC<SelectableTableProps> = ({ title, candidates, allColumns, visibleColumnIds, onColumnToggle, formStructure, availableCommittees, loading, maxSelectableColumns, isInactiveTable, isMobile, currentPhase }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const defaultAvatar = "/default-avatar.jpg";
    const [ratingSort, setRatingSort] = useState<null | "asc" | "desc">(null);

    let fixedColumns = allColumns.filter((c) => c.fixed);
    const dynamicColumns = allColumns.filter((c) => !c.fixed && visibleColumnIds.includes(c.key));

    let currentVisibleColumns: Column[];
    let currentGridTemplateColumns: string;

    if (isMobile) {
        currentVisibleColumns = allColumns.filter((c) => ["tags", "avatar", "name"].includes(c.key));
        currentGridTemplateColumns = "40px 60px 1fr";
    } else {
        if (isInactiveTable) {
            fixedColumns = [...fixedColumns, { key: "rejectedReason", header: "Motivo de Rechazo", fixed: true, width: "1fr" }];
        }
        currentVisibleColumns = [...fixedColumns, ...dynamicColumns];
        currentGridTemplateColumns = currentVisibleColumns.map((c) => c.width || "1fr").join(" ") + (dynamicColumns.length > 0 ? " 30px" : " 1fr 30px");
    }

    const displayCandidates = useMemo(() => {
        if (!ratingSort) return candidates;
        const getAvg = (c: Candidate): number | null => {
            const v = (c as unknown as { rating?: { average?: number } }).rating?.average;
            return typeof v === "number" ? v : null;
        };
        const arr = [...candidates];
        arr.sort((a, b) => {
            const av = getAvg(a);
            const bv = getAvg(b);
            if (av === null && bv === null) return 0;
            if (av === null) return 1; // unrated last
            if (bv === null) return -1;
            return ratingSort === "asc" ? av - bv : bv - av;
        });
        return arr;
    }, [candidates, ratingSort]);

    return (
        <Section>
            <SectionTitle>{title}</SectionTitle>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Select Columns">
                <ColumnSelector allColumns={allColumns} formStructure={formStructure} visibleColumnIds={visibleColumnIds} onColumnToggle={onColumnToggle} maxColumns={maxSelectableColumns} />
            </Modal>
            <CandidateTableContainer>
                <TableHeader gridtemplatecolumns={currentGridTemplateColumns} $isMobile={isMobile}>
                    {currentVisibleColumns.map((column) => (
                        <DataCell key={column.key}>
                            {column.header}
                            {!column.fixed && !isMobile && <HideButton onClick={() => onColumnToggle(column.key)} iconSize={12} />}
                            {column.key === "rating" && !isMobile && (
                                <div style={{ display: "inline-flex", gap: 6, marginLeft: 6 }}>
                                    <UpButton onClick={() => setRatingSort("asc")} iconSize={12} />
                                    <ResetButton onClick={() => setRatingSort(null)} iconSize={12} />
                                    <DownButton onClick={() => setRatingSort("desc")} iconSize={12} />
                                </div>
                            )}
                        </DataCell>
                    ))}
                    {!isMobile && dynamicColumns.length === 0 && <div />}
                    {!isMobile && ( // Hide add button on mobile
                        <DataCell key={"add-btn"}>
                            <AddButton onClick={() => setIsModalOpen(true)} iconSize={12} />
                        </DataCell>
                    )}
                </TableHeader>
                {loading ? (
                    <LoadingSpinner />
                ) : candidates.length > 0 ? (
                    displayCandidates.map((candidate) => (
                        <TableRow key={candidate._id} gridtemplatecolumns={currentGridTemplateColumns} $inactive={!candidate.active} $isMobile={isMobile} $isDifferentPhase={candidate.recruitmentPhase !== currentPhase}>
                            {currentVisibleColumns.map((column) => (
                                <DataCell key={column.key}>
                                    {column.key === "tags" && (
                                        <TagIconsContainer>
                                            {availableTags.map((tagInfo, idx) => {
                                                const currentTag = candidate.tags?.find((t) => t.tag === tagInfo.tag);
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
                                                                        fontSize: "1rem"
                                                                    }
                                                                }
                                                            }}>
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
                                    {column.key === "avatar" && <Avatar src={candidate.photoUrl || defaultAvatar} onError={(e) => (e.currentTarget.src = defaultAvatar)} />}
                                    {column.key === "name" && <CandidateName href={`/profile/${candidate._id}`}>{candidate.name}</CandidateName>}
                                    {column.key === "rejectedReason" && !isMobile && candidate.rejectedReason} {/* Hide rejectedReason on mobile */}
                                    {column.key !== "tags" && column.key !== "avatar" && column.key !== "name" && column.key !== "rejectedReason" && !isMobile && (
                                        <DashboardItem
                                            candidate={candidate}
                                            data={candidate[column.key]}
                                            columnKey={column.key}
                                            formResponses={candidate.formResponses}
                                            gridTemplateColumns={currentGridTemplateColumns}
                                            question={(() => {
                                                // Support composite keys: formName:id
                                                const parts = column.key.split(":");
                                                if (parts.length === 2) {
                                                    const [formName, qid] = parts;
                                                    for (const section of formStructure) {
                                                        const [sectionFormName] = section.title.split(": ", 2);
                                                        if (sectionFormName === formName) {
                                                            for (const question of section.questions) {
                                                                if (question.id.toString() === qid) {
                                                                    return question;
                                                                }
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
                    <ItemCard style={{ border: "none", marginBottom: 0 }}>No hay candidatos para mostrar.</ItemCard>
                )}
            </CandidateTableContainer>
        </Section>
    );
};

const DashboardPage: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [currentPhase, setCurrentPhase] = useState("");
    const [availableCommittees, setAvailableCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
    const [formStructure, setFormStructure] = useState<FormSection[]>([]);
    const [isMobile, setIsMobile] = useState(false); // Add isMobile state
    const [columnsInitialized, setColumnsInitialized] = useState(false);

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

    // (moved below allColumns)

    const allColumns: Column[] = useMemo(
        () => [
            { key: "tags", header: "", fixed: true, width: "40px" },
            { key: "avatar", header: "Foto", fixed: true, width: "60px" },
            { key: "name", header: "Nombre", fixed: true, width: "200px" },
            { key: "email", header: "Correo Electrónico", fixed: false, width: "1fr" },
            { key: "rating", header: "Valoración", fixed: false, width: "220px" },
            { key: "feedback", header: "Feedback", fixed: false, width: "130px" },
            { key: "notes", header: "Notas", fixed: false, width: "130px" },
            { key: "tutor", header: "Tutor", fixed: false, width: "1fr" },
            { key: "interests", header: "Intereses", fixed: false, width: "1fr" },
            ...formStructure.flatMap((section) => {
                const [formName] = section.title.split(": ", 2);
                return section.questions.map((question) => ({ key: `${formName}:${question.id}`, header: question.title, fixed: false, width: "1fr" }));
            })
        ],
        [formStructure]
    );

    // Initialize visible columns from localStorage or sensible defaults after formStructure (and thus allColumns) is available
    useEffect(() => {
        if (columnsInitialized) return;
        if (formStructure.length === 0) return;

        // Active table
        const savedActiveColumns = localStorage.getItem("dashboardActiveVisibleColumns");
        if (savedActiveColumns) {
            try {
                const parsedColumns = JSON.parse(savedActiveColumns);
                if (Array.isArray(parsedColumns) && parsedColumns.every((item: unknown) => typeof item === "string")) {
                    const filtered = (parsedColumns as string[]).filter((id: string) => allColumns.some((c) => c.key === id));
                    setActiveVisibleColumnIds(filtered.slice(0, MAX_SELECTED_COLUMNS));
                }
            } catch {
                // ignore error
            }
        } else {
            const initialVisibleColumnIds: string[] = [];
            const initialNonFixedKeys = ["email", "feedback", "tutor", "interests"];
            for (const key of initialNonFixedKeys) {
                const column = allColumns.find((c) => c.key === key);
                if (column && initialVisibleColumnIds.length < MAX_SELECTED_COLUMNS) {
                    initialVisibleColumnIds.push(column.key);
                }
            }
            setActiveVisibleColumnIds(initialVisibleColumnIds);
        }

        // Inactive table
        const savedInactiveColumns = localStorage.getItem("dashboardInactiveVisibleColumns");
        if (savedInactiveColumns) {
            try {
                const parsedColumns = JSON.parse(savedInactiveColumns);
                if (Array.isArray(parsedColumns) && parsedColumns.every((item: unknown) => typeof item === "string")) {
                    const filtered = (parsedColumns as string[]).filter((id: string) => allColumns.some((c) => c.key === id));
                    setInactiveVisibleColumnIds(filtered.slice(0, MAX_SELECTED_COLUMNS - 1));
                }
            } catch {
                // ignore error
            }
        } else {
            const initialVisibleColumnIds: string[] = ["rejectedReason"];
            const initialNonFixedKeys = ["email", "feedback", "tutor", "interests"];
            for (const key of initialNonFixedKeys) {
                const column = allColumns.find((c) => c.key === key);
                if (column && initialVisibleColumnIds.length < MAX_SELECTED_COLUMNS - 1) {
                    initialVisibleColumnIds.push(column.key);
                }
            }
            setInactiveVisibleColumnIds(initialVisibleColumnIds);
        }

        setColumnsInitialized(true);
    }, [formStructure, columnsInitialized, allColumns]);

    const [activeVisibleColumnIds, setActiveVisibleColumnIds] = useState<string[]>([]);
    const [inactiveVisibleColumnIds, setInactiveVisibleColumnIds] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [candidatesRes, formsRes, committeesRes, feedbackRes, notesRes, usersRes] = await Promise.all([fetch("/api/candidates"), fetch("/api/forms"), fetch("/api/committees"), fetch("/api/feedback/all"), fetch("/api/users/notes"), fetch("/api/users")]);

                let notesData = new Map();
                if (notesRes.ok) {
                    const notes = await notesRes.json();
                    notesData = new Map(Object.entries(notes));
                }

                if (candidatesRes.ok) {
                    const { candidates: candidatesData, currentPhase: phase } = await candidatesRes.json();
                    setCurrentPhase(phase);
                    const allFormResponsesRes = await fetch("/api/forms/all-responses");
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

                    // Build ratings map from users
                    // users endpoint returns array of users with possible ratings object keyed by candidateId
                    const usersJson: unknown = usersRes.ok ? await usersRes.json() : [];
                    const usersArr: unknown[] = Array.isArray(usersJson) ? usersJson : [];
                    type UserWithRatings = { _id: string; name?: string | null; image?: string | null; ratings?: Record<string, unknown> };
                    const isUser = (u: unknown): u is UserWithRatings => typeof u === "object" && u !== null && typeof (u as { _id?: unknown })._id === "string";

                    const users: UserWithRatings[] = usersArr.filter(isUser);

                    const candidatesWithData = candidatesData.map((candidate: Candidate) => {
                        const candidateResponses = allFormResponses.filter(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (response: any) => response.candidateId === candidate._id
                        );
                        const candidateFeedback = allFeedback[candidate._id] || { recruiters: [], tutor: [], volunteers: [] };
                        const note = notesData.get(candidate._id) || "";

                        // Compute ratings from recruiters (users)
                        const entries = users
                            .map((u) => {
                                const raw = u.ratings && u.ratings[candidate._id];
                                const num = typeof raw === "number" ? raw : undefined;
                                if (typeof num === "number" && num >= 1 && num <= 5) {
                                    return { userId: u._id, name: u.name || "Reclutador", image: u.image || undefined, rating: num };
                                }
                                return null;
                            })
                            .filter((e) => e !== null) as { userId: string; name: string; image?: string; rating: number }[];
                        const count = entries.length;
                        const average = count > 0 ? entries.reduce((sum, e) => sum + e.rating, 0) / count : 0;
                        return { ...candidate, formResponses: candidateResponses, feedback: candidateFeedback, notes: note, rating: { average, count, entries } };
                    });
                    setCandidates(candidatesWithData);
                } else {
                    console.error("Failed to fetch candidates");
                }

                if (formsRes.ok) {
                    const formsData = await formsRes.json();
                    if (formsData.length > 0) {
                        const allSections: FormSection[] = [];
                        formsData.forEach((form: { _id: string; formIdentifier: string; structure: string }) => {
                            const sections = JSON.parse(form.structure).map(([title, questions]: [string, FormQuestion[]]) => ({
                                // Prefix section title with a composite form key: `${formId}|${formIdentifier}` to ensure uniqueness across forms with same name
                                title: `${form._id}|${form.formIdentifier}: ${title}`,
                                questions
                            }));
                            allSections.push(...sections);
                        });
                        setFormStructure(allSections);
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
    }, []);

    useEffect(() => {
        if (!loading && columnsInitialized) {
            localStorage.setItem("dashboardActiveVisibleColumns", JSON.stringify(activeVisibleColumnIds));
        }
    }, [activeVisibleColumnIds, loading, columnsInitialized]);

    useEffect(() => {
        if (!loading && columnsInitialized) {
            localStorage.setItem("dashboardInactiveVisibleColumns", JSON.stringify(inactiveVisibleColumnIds));
        }
    }, [inactiveVisibleColumnIds, loading, columnsInitialized]);

    const handleColumnToggle = (columnKey: string, tableType: "active" | "inactive", maxAllowedColumns: number) => {
        const column = allColumns.find((c) => c.key === columnKey);
        if (!column) return;

        const visibleIds = tableType === "active" ? activeVisibleColumnIds : inactiveVisibleColumnIds;
        const setVisibleIds = tableType === "active" ? setActiveVisibleColumnIds : setInactiveVisibleColumnIds;

        const isVisible = visibleIds.includes(columnKey);

        if (isVisible) {
            if (!column.fixed) {
                setVisibleIds(visibleIds.filter((id) => id !== columnKey));
            }
        } else {
            if (visibleIds.length < maxAllowedColumns) {
                setVisibleIds([...visibleIds, columnKey]);
            }
        }
    };

    const activeCandidates = candidates.filter((c) => c.active);
    const inactiveCandidates = candidates.filter((c) => !c.active);

    return (
        <PageContainer>
            <h1>Dashboard</h1>
            <SelectableTable
                title="Candidatos Activos"
                candidates={activeCandidates}
                allColumns={allColumns}
                visibleColumnIds={activeVisibleColumnIds}
                onColumnToggle={(key) => handleColumnToggle(key, "active", MAX_SELECTED_COLUMNS)}
                storageKey="dashboardActiveVisibleColumns"
                formStructure={formStructure}
                availableCommittees={availableCommittees}
                loading={loading}
                maxSelectableColumns={MAX_SELECTED_COLUMNS}
                isInactiveTable={false}
                isMobile={isMobile} // Pass isMobile prop
                currentPhase={currentPhase}
            />
            <SelectableTable
                title="Candidatos Inactivos"
                candidates={inactiveCandidates}
                allColumns={allColumns}
                visibleColumnIds={inactiveVisibleColumnIds}
                onColumnToggle={(key) => handleColumnToggle(key, "inactive", MAX_SELECTED_COLUMNS - 1)}
                storageKey="dashboardInactiveVisibleColumns"
                formStructure={formStructure}
                availableCommittees={availableCommittees}
                loading={loading}
                maxSelectableColumns={MAX_SELECTED_COLUMNS - 1}
                isInactiveTable={true}
                isMobile={isMobile} // Pass isMobile prop
                currentPhase={currentPhase}
            />
        </PageContainer>
    );
};

export default DashboardPage;
