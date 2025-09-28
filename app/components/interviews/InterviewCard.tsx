import React from "react";
import styled from "styled-components";
import { IInterview } from "@/lib/models/interview";
import { ICandidate } from "@/lib/models/candidate";
import { IUser } from "@/lib/models/user";
import { EditButton } from "../buttons/EditButton";
import { DeleteButton } from "../buttons/DeleteButton";
import { useToast } from "../toasts/ToastContext";

interface InterviewCardProps {
  interview: IInterview;
  candidates: ICandidate[];
  users: IUser[];
  onEdit: (interview: IInterview) => void;
  onDelete: (interviewId: string) => void;
}

const Card = styled.div`
  border-radius: var(--border-radius-md);
  border: 2px solid var(--border-primary);
  padding: 15px;
  display: flex;
  flex-direction: column;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
  width: 100%;
  flex-wrap: wrap;
  gap: 10px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const CardTitle = styled.h4`
  margin: 0;
  word-break: break-word;
`;

const CardActions = styled.div`
  display: flex;
  gap: 10px;
`;

const InterviewDetails = styled.div`
  margin-top: auto;

  p {
    margin: 8px 0;
    word-break: break-word;

    a {
      display: inline-block;
    }
  }

  @media (max-width: 600px) {
    font-size: 0.9rem;
  }
`;

const ClickableName = styled.span`
  cursor: pointer;
  color: var(--text-link);
  &:hover {
    text-decoration: underline;
  }
`;

const InterviewCard: React.FC<InterviewCardProps> = ({
  interview,
  candidates,
  users,
  onEdit,
  onDelete
}) => {
  const { addToast } = useToast();
  const getUserName = (id: string) => users.find((u) => u._id === id)?.name || "Unknown";

  const handleCopyEmail = (email: string) => {
    navigator.clipboard
      .writeText(email)
      .then(() => addToast("Email copiado al portapapeles", "success"))
      .catch(() => addToast("Error al copiar el email", "error"));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Entrevista {interview.online ? "online" : "presencial"} del{" "}
          {new Date(interview.date).toLocaleDateString()}
        </CardTitle>
        <CardActions>
          <EditButton onClick={() => onEdit(interview)} iconSize={20} />
          <DeleteButton onClick={() => onDelete(interview._id)} iconSize={20} />
        </CardActions>
      </CardHeader>
      <InterviewDetails>
        <p>
          <strong>Candidatos:</strong>{" "}
          {interview.candidates.map((cId, idx) => {
            const candidate = candidates.find((c) => c._id === cId.toString());
            if (!candidate) return "Unknown";
            return (
              <React.Fragment key={candidate._id}>
                <ClickableName onClick={() => handleCopyEmail(candidate.email)}>
                  {candidate.name}
                </ClickableName>
                {idx < interview.candidates.length - 1 ? ", " : ""}
              </React.Fragment>
            );
          })}
        </p>
        <p>
          <strong>Entrevistadores:</strong>{" "}
          {interview.interviewers.map((i) => getUserName(i.toString())).join(", ")}
        </p>
      </InterviewDetails>
    </Card>
  );
};

export default InterviewCard;
