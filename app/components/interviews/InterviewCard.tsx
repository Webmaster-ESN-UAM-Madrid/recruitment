import React from 'react';
import styled from 'styled-components';
import { IInterview } from '@/lib/models/interview';
import { ICandidate } from '@/lib/models/candidate';
import { IUser } from '@/lib/models/user';
import { EditButton } from '../buttons/EditButton';
import { DeleteButton } from '../buttons/DeleteButton';

interface InterviewCardProps {
  interview: IInterview;
  candidates: ICandidate[];
  users: IUser[];
  onEdit: (interview: IInterview) => void;
  onDelete: (interviewId: string) => void;
}

const Card = styled.div`
  // background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  border: 2px solid var(--border-primary);
  padding: 15px;
  display: flex;
  flex-direction: column;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  width: 100%;
`;

const CardTitle = styled.h4`
  margin: 0;
`;

const CardActions = styled.div`
  display: flex;
  gap: 10px;
`;

const InterviewDetails = styled.div`
  margin-top: auto;
`;

const InterviewCard: React.FC<InterviewCardProps> = ({ interview, candidates, users, onEdit, onDelete }) => {
  const getUserName = (id: string) => users.find(u => u._id === id)?.name || 'Unknown';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrevista del {new Date(interview.date).toLocaleDateString()}</CardTitle>
        <CardActions>
          <EditButton onClick={() => onEdit(interview)} iconSize={20} />
          <DeleteButton onClick={() => onDelete(interview._id)} iconSize={20} />
        </CardActions>
      </CardHeader>
      <InterviewDetails>
        <p>
          <strong>Candidatos:</strong>{' '}
          {interview.candidates.map((cId, idx) => {
            const candidate = candidates.find(c => c._id === cId.toString());
            if (!candidate) return 'Unknown';
            return (
              <React.Fragment key={candidate._id}>
                <a href={`/profile/${candidate._id}`}>{candidate.name}</a>
                {idx < interview.candidates.length - 1 ? ', ' : ''}
              </React.Fragment>
            );
          })}
        </p>
        <p><strong>Entrevistadores:</strong> {interview.interviewers.map(i => getUserName(i.toString())).join(', ')}</p>
      </InterviewDetails>
    </Card>
  );
};

export default InterviewCard;
