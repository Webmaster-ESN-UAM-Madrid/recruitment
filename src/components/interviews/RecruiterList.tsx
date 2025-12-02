import React from "react";
import styled from "styled-components";
import Image from "next/image";

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 600px;
  overflow-y: auto;
`;

const RecruiterItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const AvatarPlaceholder = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
`;

const Name = styled.span`
  font-size: 14px;
  color: #333;
  font-weight: 500;
`;

const StatusDot = styled.div<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) => (props.$active ? "#10b981" : "#d1d5db")};
  margin-left: auto;
`;

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface Availability {
  userId: string;
  slots: string[];
}

interface RecruiterListProps {
  users: User[];
  availabilities: Availability[];
  onHoverUser: (userId: string | null) => void;
}

const RecruiterList: React.FC<RecruiterListProps> = ({ users, availabilities, onHoverUser }) => {
  // Filter users who have availability or are recruiters (logic depends on requirements, 
  // but let's show all users who have submitted availability or are in the system)
  // For now, showing all users passed to the component.
  
  return (
    <ListContainer>
      <h3 style={{ fontSize: "16px", marginBottom: "10px", color: "#333" }}>Reclutadores</h3>
      {users.map((user) => {
        const hasAvailability = availabilities.some(
          (a) => a.userId === user._id && a.slots.length > 0
        );
        
        return (
          <RecruiterItem
            key={user._id}
            onMouseEnter={() => onHoverUser(user._id)}
            onMouseLeave={() => onHoverUser(null)}
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={32}
                height={32}
                style={{ borderRadius: "50%" }}
              />
            ) : (
              <AvatarPlaceholder>
                {(user.name || user.email || "?").slice(0, 2).toUpperCase()}
              </AvatarPlaceholder>
            )}
            <Name>{user.name}</Name>
            <StatusDot $active={hasAvailability} title={hasAvailability ? "Disponible" : "Sin disponibilidad"} />
          </RecruiterItem>
        );
      })}
    </ListContainer>
  );
};

export default RecruiterList;
