import React, { useState, useRef, useEffect, useMemo } from "react";
import styled from "styled-components";

const TimetableContainer = styled.div`
  overflow-x: auto;
  user-select: none;
  position: relative;
  padding-bottom: 20px;
`;

const Grid = styled.div<{ cols: number; rows: number }>`
  display: grid;
  grid-template-columns: 60px repeat(${(props) => props.cols}, 1fr);
  grid-template-rows: 30px 40px repeat(${(props) => props.rows}, auto);
  gap: 1px;
  background-color: #e5e7eb;
  border: 1px solid #e5e7eb;
  min-width: 800px;
`;

const HeaderCell = styled.div`
  background-color: #f9fafb;
  padding: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const MonthCell = styled.div<{ span: number }>`
  background-color: #f3f4f6;
  grid-column: span ${(props) => props.span};
  text-align: center;
  font-weight: 700;
  font-size: 13px;
  padding: 5px;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TimeLabel = styled.div<{ $isStartOfRange?: boolean }>`
  background-color: #f9fafb;
  padding: 4px;
  text-align: right;
  font-size: 11px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  height: 30px;
  
  ${(props) => props.$isStartOfRange && `
    margin-top: 20px;
    position: relative;
    
    &::before {
      content: "";
      position: absolute;
      top: -10px;
      left: 0;
      right: 0;
      height: 1px;
      background-color: #d1d5db;
    }
  `}
`;

const Cell = styled.div<{ $selected: boolean; $isHoveredUser: boolean; opacity?: number; $isStartOfRange?: boolean }>`
  background-color: #ffffff;
  position: relative;
  cursor: pointer;
  height: 30px;
  
  ${(props) => props.$isStartOfRange && `
    margin-top: 20px;
    position: relative;
    
    &::before {
      content: "";
      position: absolute;
      top: -10px;
      left: 0;
      right: 0;
      height: 1px;
      background-color: #d1d5db;
    }
  `}
  
  ${(props) =>
    props.$selected &&
    `
    background-color: rgba(45, 212, 191, 0.8); /* Turquoise/Teal-400 */
  `}

  &:hover {
    background-color: ${(props) => (props.$selected ? "rgba(20, 184, 166, 0.8)" : "#f3f4f6")};
  }
`;

const Overlay = styled.div<{ opacity: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(59, 130, 246, ${(props) => props.opacity});
  pointer-events: none;
  mix-blend-mode: multiply;
`;

const HoverOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(168, 85, 247, 0.6); /* Purple */
  pointer-events: none;
`;

const ButtonContainer = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
`;

const SaveButton = styled.button`
  background-color: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #059669;
  }
`;

interface AvailabilityTimetableProps {
  config: {
    startDate: string;
    endDate: string;
    hourRanges: { start: number; end: number }[];
  };
  availabilities: { userId: string; slots: string[] }[];
  currentUserSlots: Date[];
  onSave: (slots: Date[]) => void;
  hoveredUserId: string | null;
}

const AvailabilityTimetable: React.FC<AvailabilityTimetableProps> = ({
  config,
  availabilities,
  currentUserSlots,
  onSave,
  hoveredUserId
}) => {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ dayIndex: number; timeIndex: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ dayIndex: number; timeIndex: number } | null>(null);
  const [initialSelectedState, setInitialSelectedState] = useState(false); // Was the start cell selected?

  // Parse dates and ranges
  const dates = useMemo(() => {
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);
    const days: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [config.startDate, config.endDate]);

  const months = useMemo(() => {
    const monthMap = new Map<string, { label: string; span: number }>();
    dates.forEach((date) => {
      let label = date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
      label = label.charAt(0).toUpperCase() + label.slice(1);
      if (monthMap.has(label)) {
        monthMap.get(label)!.span++;
      } else {
        monthMap.set(label, { label, span: 1 });
      }
    });
    return Array.from(monthMap.values());
  }, [dates]);

  // Generate time slots (30 min intervals) based on hour ranges
  const timeSlots = useMemo(() => {
    const slots: { hour: number; minute: number; label: string; isStartOfRange: boolean }[] = [];
    // Sort ranges
    const sortedRanges = [...config.hourRanges].sort((a, b) => a.start - b.start);
    
    sortedRanges.forEach((range, index) => {
      for (let h = range.start; h < range.end; h++) {
        const isStart = h === range.start && index > 0;
        slots.push({ hour: h, minute: 0, label: `${h}:00`, isStartOfRange: isStart });
        slots.push({ hour: h, minute: 30, label: `${h}:30`, isStartOfRange: false });
      }
    });
    return slots;
  }, [config.hourRanges]);

  // Initialize selected slots from props
  useEffect(() => {
    const initialSet = new Set<string>();
    currentUserSlots.forEach((date) => {
      initialSet.add(date.toISOString());
    });
    setSelectedSlots(initialSet);
  }, [currentUserSlots]);

  const getSlotId = (date: Date, timeSlot: { hour: number; minute: number }) => {
    const d = new Date(date);
    d.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
    return d.toISOString();
  };

  const getSlotFromIndices = (dayIndex: number, timeIndex: number) => {
    if (dayIndex < 0 || dayIndex >= dates.length || timeIndex < 0 || timeIndex >= timeSlots.length) return null;
    return getSlotId(dates[dayIndex], timeSlots[timeIndex]);
  };

  // Helper to check if two time indices belong to the same continuous range block
  const areInSameRange = (index1: number, index2: number) => {
    // This is tricky because timeSlots is a flat list of all allowed slots.
    // If there is a gap between ranges (e.g. 13:00-15:00 gap), the indices might be adjacent in the array
    // but represent a time jump.
    // However, the requirement says "The click and drag shouldn't go into a different time range".
    // Let's check the actual time difference.
    
    const minIndex = Math.min(index1, index2);
    const maxIndex = Math.max(index1, index2);
    
    for (let i = minIndex; i < maxIndex; i++) {
        const current = timeSlots[i];
        const next = timeSlots[i+1];
        
        // Check if next slot is exactly 30 mins after current
        const currentTime = current.hour * 60 + current.minute;
        const nextTime = next.hour * 60 + next.minute;
        
        if (nextTime - currentTime > 30) {
            return false; // Gap detected
        }
    }
    return true;
  };

  const handleMouseDown = (dayIndex: number, timeIndex: number) => {
    setIsDragging(true);
    setDragStart({ dayIndex, timeIndex });
    setDragCurrent({ dayIndex, timeIndex });
    
    const slotId = getSlotFromIndices(dayIndex, timeIndex);
    if (slotId) {
        setInitialSelectedState(selectedSlots.has(slotId));
    }
  };

  const handleMouseEnter = (dayIndex: number, timeIndex: number) => {
    if (isDragging && dragStart) {
        // Check if we are crossing time ranges
        if (areInSameRange(dragStart.timeIndex, timeIndex)) {
             setDragCurrent({ dayIndex, timeIndex });
        }
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragCurrent) {
        const newSelected = new Set(selectedSlots);
        
        const minDay = Math.min(dragStart.dayIndex, dragCurrent.dayIndex);
        const maxDay = Math.max(dragStart.dayIndex, dragCurrent.dayIndex);
        const minTime = Math.min(dragStart.timeIndex, dragCurrent.timeIndex);
        const maxTime = Math.max(dragStart.timeIndex, dragCurrent.timeIndex);
        
        for (let d = minDay; d <= maxDay; d++) {
            for (let t = minTime; t <= maxTime; t++) {
                const slotId = getSlotFromIndices(d, t);
                if (slotId) {
                    if (initialSelectedState) {
                        newSelected.delete(slotId); // Deselect if started on selected
                    } else {
                        newSelected.add(slotId); // Select if started on unselected
                    }
                }
            }
        }
        
        setSelectedSlots(newSelected);
        onSave(Array.from(newSelected).map(s => new Date(s)));
    }
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  // Calculate aggregate availability for visualization
  const getAggregateOpacity = (slotId: string) => {
    let count = 0;
    availabilities.forEach(a => {
        if (a.slots.includes(slotId)) count++;
    });
    
    if (count === 0) return 0;
    // Cap alpha at 0.8. Normalize based on total users? Or just raw count?
    // "more opaque the more people there are". Let's assume max 10 people for 0.8 opacity for now, or dynamic.
    // Let's use a simple linear scale capped at 0.8.
    const maxUsers = Math.max(availabilities.length, 1);
    const opacity = Math.min((count / maxUsers) * 0.8, 0.8);
    return opacity;
  };

  const isHoveredUserAvailable = (slotId: string) => {
    if (!hoveredUserId) return false;
    const userAvail = availabilities.find(a => a.userId === hoveredUserId);
    return userAvail?.slots.includes(slotId);
  };

  // Helper to determine if a cell is currently being dragged over
  const isInDragArea = (dayIndex: number, timeIndex: number) => {
      if (!isDragging || !dragStart || !dragCurrent) return false;
      
      const minDay = Math.min(dragStart.dayIndex, dragCurrent.dayIndex);
      const maxDay = Math.max(dragStart.dayIndex, dragCurrent.dayIndex);
      const minTime = Math.min(dragStart.timeIndex, dragCurrent.timeIndex);
      const maxTime = Math.max(dragStart.timeIndex, dragCurrent.timeIndex);
      
      return dayIndex >= minDay && dayIndex <= maxDay && timeIndex >= minTime && timeIndex <= maxTime;
  };

  return (
    <TimetableContainer onMouseLeave={handleMouseUp} onMouseUp={handleMouseUp}>
      <Grid cols={dates.length} rows={timeSlots.length}>
        {/* Month Row */}
        <div style={{ backgroundColor: "#f3f4f6" }} /> {/* Top-left empty cell for month row */}
        {months.map((month, i) => (
          <MonthCell key={i} span={month.span}>
            {month.label}
          </MonthCell>
        ))}

        {/* Header Row */}
        <div /> {/* Top-left empty cell for date row */}
        {dates.map((date, i) => (
          <HeaderCell key={i}>
            {date.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit" })}
          </HeaderCell>
        ))}

        {/* Time Rows */}
        {timeSlots.map((time, tIndex) => (
          <React.Fragment key={tIndex}>
            <TimeLabel $isStartOfRange={time.isStartOfRange}>{time.label}</TimeLabel>
            {dates.map((date, dIndex) => {
              const slotId = getSlotId(date, time);
              const isSelected = selectedSlots.has(slotId);
              const isDragActive = isInDragArea(dIndex, tIndex);
              
              // Determine visual state
              // If dragging, we show the PREDICTED state
              let visuallySelected = isSelected;
              if (isDragActive) {
                  visuallySelected = !initialSelectedState;
              }

              const aggregateOpacity = getAggregateOpacity(slotId);
              const isHovered = isHoveredUserAvailable(slotId);
              
              // When hovering a user, hide everything else
              const showSelected = hoveredUserId ? false : visuallySelected;
              const showAggregate = hoveredUserId ? false : true;

              return (
                <Cell
                  key={`${dIndex}-${tIndex}`}
                  $selected={showSelected}
                  $isHoveredUser={!!isHovered}
                  $isStartOfRange={time.isStartOfRange}
                  onMouseDown={() => handleMouseDown(dIndex, tIndex)}
                  onMouseEnter={() => handleMouseEnter(dIndex, tIndex)}
                >
                  {showAggregate && aggregateOpacity > 0 && (
                      <Overlay opacity={aggregateOpacity} />
                  )}
                  {isHovered && <HoverOverlay />}
                </Cell>
              );
            })}
          </React.Fragment>
        ))}
      </Grid>
    </TimetableContainer>
  );
};

export default AvailabilityTimetable;
