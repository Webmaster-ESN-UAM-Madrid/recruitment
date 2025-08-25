import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { ReadButton } from "../buttons/ReadButton";
import Modal from "../modals/Modal";
import Tooltip from "@mui/material/Tooltip";
import { JSX } from "react/jsx-runtime";
import FeedbackForCandidate from "../FeedbackForCandidate";
import Rating from "@mui/material/Rating";

const ItemContainer = styled.div<{ $isOverflowing: boolean }>`
    padding: 0 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    ${(props) =>
        props.$isOverflowing &&
        `
    text-decoration: underline dotted;
    cursor: help;
  `}
`;

export const HiddenInput = styled.input`
    display: none;
`;

export const CustomCheckbox = styled.span<{ checked: boolean }>`
    width: 16px;
    height: 16px;
    display: inline-block;
    border: 2px solid ${({ checked }) => (checked ? "#0070f0" : "#ccc")};
    background-color: ${({ checked }) => (checked ? "#57a5ff" : "#fff")};
    border-radius: 3px;
    position: relative;
    box-sizing: border-box;

    &::after {
        content: "";
        display: ${({ checked }) => (checked ? "block" : "none")};
        position: absolute;
        left: 4px;
        top: 0px;
        width: 4px;
        height: 8px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
    }
`;

const CustomRadio = styled.span<{ checked: boolean }>`
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid ${({ checked }) => (checked ? "#0070f0" : "#ccc")};
    background-color: ${({ checked }) => (checked ? "#57a5ff" : "#fff")};
    display: inline-block;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-top: 10px;
    border-radius: var(--border-radius-md);
    overflow: hidden;

    th,
    td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: center;
    }

    th {
        background-color: #f2f2f2;
    }
`;

const NoteContainer = styled.p`
    white-space: pre-wrap;
`;

interface Candidate {
    _id: string;
    name: string;
    email: string;
    photoUrl?: string;
    active: boolean;
    alternateEmails?: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formResponses?: any[];
    interests?: string[];
    feedback?: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recruiters: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tutor: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        volunteers: any[];
    };
    rating?: {
        average: number;
        count: number;
        entries: { userId: string; name: string; image?: string; rating: number }[];
    };
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

interface Committee {
    _id: string;
    name: string;
    color: string;
}

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

const ChipContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
`;

interface DashboardItemProps {
    candidate: Candidate;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    columnKey: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formResponses?: any[];
    gridTemplateColumns?: string;
    question?: FormQuestion;
    availableCommittees: Committee[];
}

const DashboardItem: React.FC<DashboardItemProps> = ({ candidate, data, columnKey, formResponses, gridTemplateColumns, question, availableCommittees }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    const checkOverflow = () => {
        if (textRef.current) {
            setIsOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
        }
    };

    useEffect(() => {
        checkOverflow();
        window.addEventListener("resize", checkOverflow);
        return () => window.removeEventListener("resize", checkOverflow);
    }, [data, formResponses, gridTemplateColumns, question, availableCommittees]);

    // Support composite keys: (formKey)":"(questionId)
    // Where formKey may be `${formId}|${formIdentifier}` to guarantee uniqueness across same-named forms
    const keyParts = columnKey.split(":");
    const effectiveKey = keyParts.length === 2 ? keyParts[1] : columnKey;
    const formKey = keyParts.length === 2 ? keyParts[0] : undefined;
    const formIdFromKey = formKey && formKey.includes("|") ? formKey.split("|", 2)[0] : undefined;
    const isFormQuestion = !isNaN(Number(effectiveKey));

    let displayValue: string | JSX.Element;
    let modalContent: JSX.Element | null = null;
    let showModalButton = false;

    if (isFormQuestion && formResponses) {
        const normalizeFormId = (fid: unknown): string | undefined => {
            if (!fid) return undefined;
            if (typeof fid === "string") return fid;
            if (typeof fid === "object" && fid !== null) {
                // Could be populated form object or a mongoose ObjectId-like value
                const maybeObj = fid as { _id?: unknown; toString?: () => string };
                if (maybeObj._id !== undefined) return String(maybeObj._id);
                if (typeof maybeObj.toString === "function") return String(maybeObj.toString());
            }
            return undefined;
        };

        const formResponse = formResponses.find((response) => {
            const hasAnswer = response?.responses && response.responses[effectiveKey] !== undefined;
            if (!hasAnswer) return false;
            if (!formIdFromKey) return hasAnswer; // legacy or non-composite form key
            const respFormId = normalizeFormId(response.formId);
            return respFormId === formIdFromKey;
        });
        const rawValue = formResponse && formResponse.responses[effectiveKey] !== undefined ? formResponse.responses[effectiveKey] : "";

        switch (question?.type) {
            case "DATE":
                displayValue = rawValue !== "" ? new Date(rawValue).toLocaleDateString() : "";
                break;
            case "CHECKBOX":
                if (Array.isArray(rawValue) && rawValue.length > 0) {
                    displayValue = `Ver detalles (${rawValue.length} seleccionados)`;
                    modalContent = (
                        <ul>
                            {rawValue.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    );
                    showModalButton = true;
                } else {
                    displayValue = "";
                }
                break;
            case "GRID":
            case "CHECKBOX_GRID":
                if (typeof rawValue === "object" && rawValue !== null && Object.keys(rawValue).length > 0) {
                    const isCheckboxGrid = question.type === "CHECKBOX_GRID";

                    displayValue = `Ver detalles`;

                    const columns = question.columns || [];
                    const rows = question.rows || [];

                    modalContent = (
                        <Table>
                            <thead>
                                <tr>
                                    <th></th>
                                    {columns.map((col, colIndex) => (
                                        <th key={colIndex}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        <td>{row}</td>
                                        {columns.map((col, colIndex) => {
                                            const response = rawValue[rowIndex];
                                            const isChecked = isCheckboxGrid ? Array.isArray(response) && response.includes(col) : response === col;

                                            return (
                                                <td key={colIndex}>
                                                    <HiddenInput type={isCheckboxGrid ? "checkbox" : "radio"} checked={isChecked} disabled />
                                                    {isCheckboxGrid ? <CustomCheckbox checked={isChecked} /> : <CustomRadio checked={isChecked} />}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    );
                    showModalButton = true;
                } else {
                    displayValue = "";
                }
                break;
            case "TEXT":
            case "PARAGRAPH_TEXT":
            case "MULTIPLE_CHOICE":
            case "LIST":
            default:
                displayValue = typeof rawValue === "object" ? JSON.stringify(rawValue) : rawValue || "";
                break;
        }
    } else if (columnKey === "email") {
        if (candidate?.alternateEmails && candidate.alternateEmails.length > 0) {
            displayValue = `${candidate.email} (Otros emails: ${candidate.alternateEmails.join(", ")})`;
        } else {
            displayValue = candidate.email;
        }
    } else if (columnKey === "interests") {
        if (candidate?.interests && candidate.interests.length > 0 && availableCommittees.length > 0) {
            const interestsWithDetails = candidate.interests.map((interestId: string) => availableCommittees.find((comm) => comm._id === interestId)).filter(Boolean) as Committee[];

            displayValue = (
                <ChipContainer>
                    {interestsWithDetails.map((interest) => (
                        <InterestBadge key={interest._id} color={interest.color}>
                            {interest.name}
                        </InterestBadge>
                    ))}
                </ChipContainer>
            );
        } else {
            displayValue = "";
        }
    } else {
        displayValue = typeof data === "object" ? JSON.stringify(data) : data || "";
    }

    const content = (
        <ItemContainer ref={textRef} $isOverflowing={isOverflowing}>
            {displayValue}
        </ItemContainer>
    );

    if (columnKey === "feedback") {
        const hasFeedback = candidate.feedback && (candidate.feedback.recruiters.length > 0 || candidate.feedback.tutor.length > 0 || candidate.feedback.volunteers.length > 0);
        return (
            <ItemContainer $isOverflowing={false}>
                <ReadButton onClick={() => setIsModalOpen(true)} iconSize={20} disabled={!hasFeedback} />
                {hasFeedback && (
                    <Modal title={`Feedback de ${candidate?.name || "[Candidato]"}`} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                        <FeedbackForCandidate candidateId={candidate._id} feedbackData={candidate.feedback} />
                    </Modal>
                )}
            </ItemContainer>
        );
    }

    if (columnKey === "rating") {
        const avg = candidate.rating?.average || 0;
        const count = candidate.rating?.count || 0;
        const hasRatings = count > 0;
        return (
            <ItemContainer $isOverflowing={false}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Rating value={avg} precision={0.1} readOnly size="small" sx={{ color: "var(--button-primary-bg)" }} />
                        <small>({count})</small>
                    </div>
                    <ReadButton onClick={() => setIsModalOpen(true)} iconSize={20} disabled={!hasRatings} />
                </div>
                {hasRatings && (
                    <Modal title={`Valoraciones de ${candidate?.name || "[Candidato]"}`} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {candidate.rating?.entries.map((e) => (
                                <div key={e.userId} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--border-primary)", borderRadius: 8, padding: 8 }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="Avatar del reclutador" src={e.image || "/default-avatar.jpg"} onError={(ev) => (ev.currentTarget.src = "/default-avatar.jpg")} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <strong style={{ marginBottom: 2 }}>{e.name}</strong>
                                        <Rating value={e.rating} readOnly size="small" sx={{ color: "var(--button-primary-bg)" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Modal>
                )}
            </ItemContainer>
        );
    }

    if (columnKey === "notes") {
        const hasNote = !!data;
        return (
            <ItemContainer $isOverflowing={false}>
                <ReadButton onClick={() => setIsModalOpen(true)} iconSize={20} disabled={!hasNote} />
                {hasNote && (
                    <Modal title={`Notas sobre ${candidate?.name || "[Candidato]"}`} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                        <NoteContainer>{data}</NoteContainer>
                    </Modal>
                )}
            </ItemContainer>
        );
    }

    if (showModalButton || (isFormQuestion && ["MULTIPLE_CHOICE", "CHECKBOX", "GRID", "CHECKBOX_GRID"].includes(question?.type || "") && displayValue === "")) {
        // Show disabled button if always-overflowing column is empty
        const isDisabled = !showModalButton;
        return (
            <ItemContainer $isOverflowing={false}>
                <ReadButton onClick={() => setIsModalOpen(true)} iconSize={20} disabled={isDisabled} />
                {showModalButton && (
                    <Modal title={`Detalles de la respuesta`} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                        {modalContent}
                    </Modal>
                )}
            </ItemContainer>
        );
    }

    return isOverflowing ? (
        <Tooltip
            title={typeof displayValue === "string" ? displayValue : undefined}
            arrow
            slotProps={{
                tooltip: {
                    sx: {
                        fontSize: "1rem" // Adjust as needed
                    }
                }
            }}>
            {content}
        </Tooltip>
    ) : (
        content
    );
};

export default DashboardItem;
