"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { useSession } from "next-auth/react";
import AvailabilityTimetable from "./AvailabilityTimetable";
import RecruiterList from "./RecruiterList";
import { useToast } from "@/src/components/toasts/ToastContext";

const Container = styled.div`
  background-color: #ffffff;
  border-radius: var(--border-radius-md);
  padding: 32px;
  margin: 20px auto;
  max-width: 100%;
  display: flex;
  gap: 20px;
  overflow-x: auto;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MainContent = styled.div`
  flex: 1;
  min-width: 0;
  overflow-x: auto;
`;

const Sidebar = styled.div`
  width: 250px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
  font-family: "Montserrat", sans-serif;
`;

interface Config {
  availability?: {
    startDate: string;
    endDate: string;
    hourRanges: { start: number; end: number }[];
  };
  recruiters?: { email: string }[];
}

interface Availability {
  userId: string;
  slots: string[]; // ISO strings
}

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

const AvailabilitySection = () => {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [config, setConfig] = useState<Config | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [configRes, availabilitiesRes, usersRes] = await Promise.all([
        fetch("/api/config"),
        fetch("/api/availability"),
        fetch("/api/users")
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
      }

      if (availabilitiesRes.ok) {
        const availabilitiesData = await availabilitiesRes.json();
        setAvailabilities(availabilitiesData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching availability data:", error);
      addToast("Error al cargar datos de disponibilidad", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveAvailability = async (slots: Date[]) => {
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ slots })
      });

      if (res.ok) {
        addToast("Disponibilidad guardada correctamente", "success");
        fetchData();
      } else {
        addToast("Error al guardar disponibilidad", "error");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      addToast("Error al guardar disponibilidad", "error");
    }
  };

  if (loading) return <div>Cargando disponibilidad...</div>;
  if (!config?.availability || !config.availability.startDate || !config.availability.endDate) {
    return null; // Or show a message that availability is not configured
  }

  const currentUserAvailability = availabilities.find(
    (a) => users.find((u) => u._id === a.userId)?.email === session?.user?.email
  );

  return (
    <Container>
      <MainContent>
        <Title>Disponibilidad para Entrevistas</Title>
        <AvailabilityTimetable
          config={config.availability}
          availabilities={availabilities}
          currentUserSlots={currentUserAvailability?.slots.map((s) => new Date(s)) || []}
          onSave={handleSaveAvailability}
          hoveredUserId={hoveredUserId}
        />
      </MainContent>
      <Sidebar>
        <RecruiterList
          users={users.filter((u) => config?.recruiters?.some((r) => r.email === u.email))}
          availabilities={availabilities}
          onHoverUser={setHoveredUserId}
        />
      </Sidebar>
    </Container>
  );
};

export default AvailabilitySection;
