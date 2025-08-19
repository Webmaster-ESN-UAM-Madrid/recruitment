import React, { useState, useEffect } from "react";
import styled from "styled-components";
import LoadingSpinner from "@/app/components/loaders/LoadingSpinner";
import { useToast } from "@/app/components/toasts/ToastContext";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const FeedbackContainer = styled.div`
    $ > div {
        margin-bottom: 20px;
    }

    & > div:last-child {
        margin-bottom: 0;
    }
`;

const CategorySection = styled.div`
    margin-bottom: 20px;
    border: 2px solid var(--border-secondary);
    border-radius: var(--border-radius-md);
    overflow: hidden;
`;

const AccordionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 10px 15px;
`;

const SectionTitle = styled.h3`
    margin: 0;
`;

const AccordionContent = styled.div<{ $expanded: boolean }>`
    display: grid;
    grid-template-rows: ${({ $expanded }) => ($expanded ? "1fr" : "0fr")};
    transition: grid-template-rows 0.3s ease-in-out;
    overflow: hidden;

    & > div {
        overflow: hidden;
    }
`;

const FeedbackList = styled.div`
    border-top: 2px solid var(--border-secondary);
    padding: 10px 15px;
`;

const FeedbackItem = styled.div`
    background-color: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: var(--border-radius-md);
    padding: 10px;
    margin-bottom: 10px;
    display: flex;
    align-items: flex-start;
    gap: 10px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const UserAvatar = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
`;

const FeedbackContent = styled.div`
    flex-grow: 1;
`;

const UserName = styled.p`
    font-weight: bold;
    color: var(--brand-primary);
`;

const FeedbackHeader = styled.div`
    display: flex;
    align-items: flex-end;
    gap: 10px;
`;

const FeedbackText = styled.p`
    margin: 0;
    white-space: pre-wrap;
`;

const FeedbackDates = styled.small`
    font-size: 0.75em;
    color: var(--text-secondary);
    white-space: nowrap;
    display: block;
`;

interface CategorizedFeedback {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recruiters: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tutor: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    volunteers: any[];
}

interface FeedbackForCandidateProps {
    candidateId: string;
    feedbackData?: CategorizedFeedback;
}

const FeedbackForCandidate: React.FC<FeedbackForCandidateProps> = ({ candidateId, feedbackData }) => {
    const { addToast } = useToast();
    const [feedback, setFeedback] = useState<CategorizedFeedback | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<{
        recruiters: boolean;
        tutor: boolean;
        volunteers: boolean;
    }>({ recruiters: true, tutor: true, volunteers: true });
    const defaultAvatar = "/default-avatar.jpg";

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processFeedback = (data: any) => {
            setFeedback(data);
        };

        const fetchFeedback = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/feedback/candidate/${candidateId}`);
                if (res.ok) {
                    const data: CategorizedFeedback = await res.json();
                    processFeedback(data);
                } else {
                    addToast("Error al obtener el feedback del candidato", "error");
                }
            } catch (error) {
                console.error("Failed to fetch feedback:", error);
                addToast("Ocurrió un error al cargar el feedback", "error");
            } finally {
                setLoading(false);
            }
        };

        if (feedbackData) {
            console.log(feedbackData);
            processFeedback(feedbackData);
            setLoading(false);
        } else if (candidateId) {
            fetchFeedback();
        }
    }, [candidateId, feedbackData, addToast]);

    const toggleAccordion = (category: keyof typeof expandedCategories) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!feedback) {
        return <p>No se pudo cargar el feedback.</p>;
    }

    const renderFeedbackCategory = (category: keyof CategorizedFeedback, title: string) => (
        <CategorySection>
            <AccordionHeader onClick={() => toggleAccordion(category)}>
                <SectionTitle>
                    {title} ({feedback[category].length})
                </SectionTitle>
                {expandedCategories[category] ? <FaChevronUp /> : <FaChevronDown />}
            </AccordionHeader>
            <AccordionContent $expanded={expandedCategories[category]}>
                <div>
                    <FeedbackList>
                        {feedback[category].length > 0 ? (
                            feedback[category].map((f) => (
                                <FeedbackItem key={f._id}>
                                    <UserAvatar src={f.givenBy.image || defaultAvatar} onError={(e) => (e.currentTarget.src = defaultAvatar)} />
                                    <FeedbackContent>
                                        <FeedbackHeader>
                                            <UserName>{f.givenBy.name}</UserName>
                                            <FeedbackDates>
                                                Publicado el {new Date(f.createdAt).toLocaleDateString()}
                                                {f.isEdited && <> · Editado el {new Date(f.updatedAt).toLocaleDateString()}</>}
                                            </FeedbackDates>
                                        </FeedbackHeader>
                                        <FeedbackText>{f.content}</FeedbackText>
                                    </FeedbackContent>
                                </FeedbackItem>
                            ))
                        ) : (
                            <p>No hay feedback de {title.toLowerCase()}.</p>
                        )}
                    </FeedbackList>
                </div>
            </AccordionContent>
        </CategorySection>
    );

    return (
        <FeedbackContainer>
            {renderFeedbackCategory("recruiters", "Reclutadores")}
            {renderFeedbackCategory("tutor", "Padrino")}
            {renderFeedbackCategory("volunteers", "Voluntarios")}
        </FeedbackContainer>
    );
};

export default FeedbackForCandidate;
