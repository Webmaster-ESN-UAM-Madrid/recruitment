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
  committee?: string;
  date?: string | Date;
  endDate?: string | Date;
}

interface ActivityCardProps {
  activity: Activity;
  color?: string;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

const Card = styled.div<{ $color?: string }>`
  border-radius: var(--border-radius-md);
  border: 2px solid ${(props) => props.$color || "var(--border-primary)"};
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--bg-primary);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    background-color: ${(props) => props.$color || "transparent"};
  }

  &:hover {
    box-shadow: var(--shadow-sm);
    transform: translateY(-2px);
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
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

const ParticipantCount = styled.span`
  color: var(--brand-primary);
  font-weight: 500;
`;

const DateText = styled.span`
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TimeText = styled.span`
  color: var(--brand-primary);
  font-weight: 600;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, color, onEdit, onDelete }) => {
  const feedbackUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/feedback?activity=${activity.slug}`
    : "";

  return (
    <Card $color={color}>
      <Content>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Title>{activity.title}</Title>
        </div>
        <SlugText>
          {activity.slug}
          {activity.committee && (
            <span style={{ 
              opacity: 0.7, 
              fontSize: "0.8rem", 
              backgroundColor: "var(--bg-secondary)", 
              padding: "2px 6px", 
              borderRadius: "4px" 
            }}>
              • {activity.committee}
            </span>
          )}
        </SlugText>
        <InfoRow>
          <ParticipantCount>{activity.candidates.length} participantes</ParticipantCount>
          {activity.date && (
            <DateText>
              {new Date(activity.date).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short"
              })}
              {activity.endDate && (
                <> - {new Date(activity.endDate).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short"
                })}</>
              )}
              <TimeText>
                {new Date(activity.date).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false
                })}
              </TimeText>
            </DateText>
          )}
        </InfoRow>
      </Content>
      <Actions>
        <CopyButton content={feedbackUrl} iconSize={20} />
        <EditButton onClick={() => onEdit(activity)} iconSize={20} />
        <DeleteButton onClick={() => onDelete(activity._id)} iconSize={20} />
      </Actions>
    </Card>
  );
};

export default ActivityCard;
