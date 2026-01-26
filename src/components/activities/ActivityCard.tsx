"use client";

import React from "react";
import styled from "styled-components";
import { EditButton } from "../buttons/EditButton";
import { DeleteButton } from "../buttons/DeleteButton";
import { CopyButton } from "../buttons/CopyButton";

interface Activity {
  _id: string;
  title: string;
  slug: string;
  candidates: string[];
}

interface ActivityCardProps {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (slug: string) => void;
}

const Card = styled.div`
  border-radius: var(--border-radius-md);
  border: 2px solid var(--border-primary);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--bg-primary);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    box-shadow: var(--shadow-sm);
  }

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
`;

const SlugText = styled.span`
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-family: monospace;
`;

const ParticipantCount = styled.span`
  font-size: 0.85rem;
  color: var(--brand-primary);
  font-weight: 500;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onEdit, onDelete }) => {
  const feedbackUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/feedback?activity=${activity.slug}`
    : "";

  return (
    <Card>
      <Content>
        <Title>{activity.title}</Title>
        <SlugText>{activity.slug}</SlugText>
        <ParticipantCount>{activity.candidates.length} participantes</ParticipantCount>
      </Content>
      <Actions>
        <CopyButton content={feedbackUrl} iconSize={20} />
        <EditButton onClick={() => onEdit(activity)} iconSize={20} />
        <DeleteButton onClick={() => onDelete(activity.slug)} iconSize={20} />
      </Actions>
    </Card>
  );
};

export default ActivityCard;
