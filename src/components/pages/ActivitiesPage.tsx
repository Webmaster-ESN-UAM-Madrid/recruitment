"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useSession } from "next-auth/react";
import LoadingSpinner from "../loaders/LoadingSpinner";
import { AddButton } from "../buttons/AddButton";
import { CancelButton } from "../buttons/CancelButton";
import { SaveButton } from "../buttons/SaveButton";
import { useToast } from "../toasts/ToastContext";
import Modal from "../modals/Modal";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import ActivityCard from "../activities/ActivityCard";

const PageContainer = styled.div`
  padding: 20px;
`;

const Container = styled.div`
  background-color: #ffffff;
  border-radius: var(--border-radius-md);
  padding: 32px;
  margin: 20px auto;
  max-width: 1000px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const ResponsiveGrid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.$cols || 2}, 1fr);
  gap: 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

interface Activity {
  _id: string;
  title: string;
  slug: string;
  candidates: string[];
  committee?: string;
  date?: string | Date;
  endDate?: string | Date;
}

interface Candidate {
  _id: string;
  name: string;
}

interface Committee {
  _id: string;
  name: string;
  color: string;
}

const ActivitiesPage: React.FC = () => {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [availableCommittees, setAvailableCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>([]);
  const [committee, setCommittee] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [activitiesRes, candidatesRes, committeesRes] = await Promise.all([
          fetch("/api/activities"),
          fetch("/api/candidates/active"),
          fetch("/api/committees")
        ]);

        if (activitiesRes.ok) {
          setActivities(await activitiesRes.json());
        }
        if (candidatesRes.ok) {
          const data = await candidatesRes.json();
          setCandidates(data.candidates);
        }
        if (committeesRes.ok) {
          setAvailableCommittees(await committeesRes.json());
        }
      } catch (error) {
        addToast("Error al cargar datos", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addToast]);

  const openModal = (activity?: Activity) => {
    if (activity) {
      setEditingActivity(activity);
      setTitle(activity.title);
      setSlug(activity.slug);
      setCommittee(activity.committee || "");
      if (activity.date) {
        const d = new Date(activity.date);
        // Correctly format for datetime-local: YYYY-MM-DDTHH:mm
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localISODate = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
        setDate(localISODate);
      } else {
        setDate("");
      }
      if (activity.endDate) {
        const d = new Date(activity.endDate);
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localISODate = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
        setEndDate(localISODate);
      } else {
        setEndDate("");
      }
      
      const populated = activity.candidates
        .map(id => candidates.find(c => c._id === id))
        .filter(Boolean) as Candidate[];
      setSelectedCandidates(populated);
    } else {
      setEditingActivity(null);
      setTitle("");
      setSlug("");
      setCommittee("");
      setDate("");
      setEndDate("");
      setSelectedCandidates([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingActivity(null);
    setTitle("");
    setSlug("");
    setCommittee("");
    setDate("");
    setEndDate("");
    setSelectedCandidates([]);
  };

  const handleSave = async () => {
    if (!title || !slug) {
      addToast("Título y slug son obligatorios", "info");
      return;
    }

    // Using ID for updates to be consistent and avoid slug conflicts during editing
    const url = editingActivity ? `/api/activities/${editingActivity._id}` : "/api/activities";
    const method = editingActivity ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          slug, 
          candidates: selectedCandidates.map(c => c._id),
          committee,
          date: date ? new Date(date) : undefined,
          endDate: endDate ? new Date(endDate) : undefined
        })
      });

      if (res.ok) {
        const saved = await res.json();
        if (editingActivity) {
          setActivities(activities.map((a) => (a._id === saved._id ? saved : a)));
          addToast("Actividad actualizada", "success");
        } else {
          setActivities([saved, ...activities]);
          addToast("Actividad creada", "success");
        }
        closeModal();
      } else {
        const error = await res.json();
        addToast(error.message || "Error al guardar", "error");
      }
    } catch (error) {
      addToast("Ocurrió un error", "error");
    }
  };

  const handleDelete = async (idToDelete: string) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta actividad?")) return;

    try {
      const res = await fetch(`/api/activities/${idToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setActivities(activities.filter((a) => a._id !== idToDelete));
        addToast("Actividad eliminada", "success");
      } else {
        addToast("No se pudo eliminar", "error");
      }
    } catch (error) {
      addToast("Error al eliminar", "error");
    }
  };

  return (
    <PageContainer>
      <Container>
        <Header>
          <h2 style={{ marginBottom: 0, color: "#333", fontFamily: "Montserrat, sans-serif" }}>Actividades de Reclutamiento</h2>
          <AddButton onClick={() => openModal()} iconSize={20} ariaLabel="Nueva Actividad" />
        </Header>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <ActivityList>
            {activities.length > 0 ? (
              activities.map((activity) => {
                const comm = availableCommittees.find(c => c.name === activity.committee);
                return (
                  <ActivityCard 
                    key={activity._id} 
                    activity={activity} 
                    color={comm?.color}
                    onEdit={openModal} 
                    onDelete={handleDelete} 
                  />
                );
              })
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
                No hay actividades definidas. Crea una nueva para agrupar candidatos.
              </div>
            )}
          </ActivityList>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingActivity ? "Editar Actividad" : "Nueva Actividad"}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
            <TextField
              label="Título de la Actividad"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Taller de Bienvenida"
            />

            <ResponsiveGrid>
              <TextField
                label="Slug Identificador"
                fullWidth
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                helperText="URL: /feedback?activity={slug}"
                placeholder="ej: taller-bienvenida"
              />
              <TextField
                select
                label="Comité Responsable"
                fullWidth
                value={committee}
                onChange={(e) => setCommittee(e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                <option value=""></option>
                {availableCommittees.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </TextField>
            </ResponsiveGrid>

            <ResponsiveGrid>
              <TextField
                label="Fecha y Hora Inicio"
                type="datetime-local"
                fullWidth
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label="Fecha y Hora Fin (Opcional)"
                type="datetime-local"
                fullWidth
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </ResponsiveGrid>
            
            <Autocomplete
              multiple
              options={candidates}
              getOptionLabel={(option) => option.name}
              value={selectedCandidates}
              onChange={(_, newValue) => setSelectedCandidates(newValue)}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Candidatos Participantes" 
                  placeholder="Selecciona candidatos" 
                />
              )}
              isOptionEqualToValue={(option, value) => option._id === value._id}
            />

            <ModalActions>
              <CancelButton onClick={closeModal} />
              <SaveButton onClick={handleSave} />
            </ModalActions>
          </div>
        </Modal>
      </Container>
    </PageContainer>
  );
};

export default ActivitiesPage;
