"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";

interface Candidate {
  id: string;
  name: string;
  photoUrl?: string;
}

interface Activity {
  _id: string;
  title: string;
  slug: string;
  candidates: string[];
  committee?: string;
  date?: string | Date;
  endDate?: string | Date;
}

interface ActivityCalendarProps {
  activities: Activity[];
  candidates: Candidate[];
  mode: "stats" | "candidate";
  candidateId?: string;
  committeeColors?: Record<string, string>;
}

const CalendarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  color: var(--text-primary);
  overflow-x: auto;
  padding-bottom: 8px;

  /* Custom scrollbar for better aesthetics */
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-primary);
    border-radius: 10px;
  }
`;

const DayLabels = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  text-align: center;
  background-color: var(--border-primary);
  border: 1px solid var(--border-primary);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  min-width: 800px;
  position: sticky;
  top: 0;
  z-index: 20;
`;

const DayLabel = styled.div`
  padding: 12px 4px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  background-color: var(--bg-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: var(--border-primary);
  border: 1px solid var(--border-primary);
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  min-width: 800px;
`;

const DayCell = styled.div<{ $isPadding?: boolean; $isToday?: boolean }>`
  min-height: 120px;
  background-color: ${props => props.$isPadding ? "var(--bg-secondary)" : "var(--bg-primary)"};
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  opacity: ${props => props.$isPadding ? 0.4 : 1};
  
  ${props => props.$isToday && `
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background-color: var(--brand-primary);
    }
  `}
`;

const DayNumber = styled.span<{ $active?: boolean }>`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${props => props.$active ? "var(--brand-primary)" : "var(--text-secondary)"};
  margin-bottom: 4px;
`;

const MiniActivity = styled.div<{ $color?: string; $attended?: boolean; $isCandidateMode?: boolean }>`
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 2px solid ${props => props.$color || "var(--border-primary)"};
  background-color: ${props => props.$color ? alpha(props.$color, 0.15) : "var(--bg-secondary)"};
  color: var(--text-primary);
  line-height: 1.2;
  cursor: pointer;
  transition: all 0.2s ease;
  
  opacity: ${props => (props.$isCandidateMode && !props.$attended ? 0.4 : 1)};
  filter: ${props => (props.$isCandidateMode && !props.$attended ? "grayscale(80%)" : "none")};

  &:hover {
    transform: scale(1.02);
    background-color: ${props => props.$color ? alpha(props.$color, 0.25) : "var(--bg-secondary)"};
    z-index: 10;
  }
`;

const ParticipantPeek = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 6px;
  gap: 4px;
`;

const TinyAvatar = styled(Avatar)`
  width: 24px !important;
  height: 24px !important;
  font-size: 0.7rem !important;
  border: 1px solid var(--bg-primary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
`;

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  activities,
  candidates,
  mode,
  candidateId,
  committeeColors = {}
}) => {
  const gridData = useMemo(() => {
    if (activities.length === 0) return [];

    let minT = Infinity;
    let maxT = -Infinity;

    activities.forEach(a => {
      const start = a.date ? new Date(a.date).getTime() : Date.now();
      const end = a.endDate ? new Date(a.endDate).getTime() : start;
      if (start < minT) minT = start;
      if (end > maxT) maxT = end;
    });

    const firstDate = new Date(minT);
    const lastDate = new Date(maxT);

    // Get Monday of the first week
    const startDate = new Date(firstDate);
    startDate.setHours(0, 0, 0, 0);
    const day = (startDate.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - day);

    // Get Sunday of the last week
    const endDate = new Date(lastDate);
    endDate.setHours(23, 59, 59, 999);
    const endDay = (endDate.getDay() + 6) % 7;
    endDate.setDate(endDate.getDate() + (6 - endDay));

    const grid: Date[] = [];
    const curr = new Date(startDate);
    while (curr <= endDate) {
      grid.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    return grid;
  }, [activities]);

  const getParticipants = (participantIds: string[]) => {
    return participantIds
      .map(id => candidates.find(c => c.id === id))
      .filter(Boolean) as Candidate[];
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getActivityStatus = (activity: Activity, day: Date) => {
    const start = activity.date ? new Date(activity.date) : null;
    if (!start) return false;
    
    // Set to 00:00:00 for comparison
    const dayPlain = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const startPlain = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    
    if (activity.endDate) {
      const end = new Date(activity.endDate);
      const endPlain = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
      return dayPlain >= startPlain && dayPlain <= endPlain;
    }
    
    return dayPlain === startPlain;
  };

  const getDayLabel = (day: Date, index: number) => {
    const isFirst = index === 0;
    const isFirstOfMonth = day.getDate() === 1;
    
    if (isFirst || isFirstOfMonth) {
      const monthShort = day.toLocaleString("es-ES", { month: "short" }).toUpperCase().replace(".", "");
      return `${day.getDate()} ${monthShort}`;
    }
    return day.getDate().toString();
  };

  const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const today = new Date();

  return (
    <CalendarWrapper>
      <DayLabels>
        {dayLabels.map(label => <DayLabel key={label}>{label}</DayLabel>)}
      </DayLabels>
      <DaysGrid>
        {gridData.map((day, idx) => {
          const dayActivities = activities
            .filter(a => getActivityStatus(a, day))
            .sort((a, b) => {
              const tA = a.date ? new Date(a.date).getTime() : 0;
              const tB = b.date ? new Date(b.date).getTime() : 0;
              return tA - tB;
            });
          const isToday = isSameDay(day, today);
          
          return (
            <DayCell key={idx} $isToday={isToday}>
              <DayNumber $active={isToday}>{getDayLabel(day, idx)}</DayNumber>
              {dayActivities.map(activity => {
                const participants = getParticipants(activity.candidates);
                const isAttended = candidateId ? activity.candidates.includes(candidateId) : false;
                
                return (
                  <Tooltip 
                    key={activity._id} 
                    title={
                      <div style={{ padding: "4px" }}>
                        <strong>{activity.title}</strong>
                        {participants.length > 0 && (
                          <div style={{ marginTop: "6px", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "2px" }}>
                            {participants.map(p => (
                              <div key={p.id} style={{ opacity: 0.9 }}>• {p.name}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    } 
                    arrow 
                    placement="top"
                  >
                    <MiniActivity 
                      $color={activity.committee ? committeeColors[activity.committee] : undefined}
                      $attended={isAttended}
                      $isCandidateMode={mode === "candidate"}
                    >
                      {activity.title}
                      {mode === "stats" && participants.length > 0 && (
                        <ParticipantPeek>
                          {participants.map(p => (
                            <TinyAvatar key={p.id} src={p.photoUrl} alt={p.name}>
                              {p.name.charAt(0)}
                            </TinyAvatar>
                          ))}
                        </ParticipantPeek>
                      )}
                    </MiniActivity>
                  </Tooltip>
                );
              })}
            </DayCell>
          );
        })}
      </DaysGrid>
      {activities.length === 0 && (
        <div style={{ padding: "60px", textAlign: "center", color: "var(--text-secondary)", backgroundColor: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-primary)", margin: "20px" }}>
           📅 No hay actividades programadas.
        </div>
      )}
    </CalendarWrapper>
  );
};

export default ActivityCalendar;
