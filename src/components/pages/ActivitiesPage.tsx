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

interface Activity {
  _id: string;
  title: string;
  slug: string;
  candidates: string[];
}

interface Candidate {
  _id: string;
  name: string;
}

const ActivitiesPage: React.FC = () => {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [activitiesRes, candidatesRes] = await Promise.all([
          fetch("/api/activities"),
          fetch("/api/candidates/active")
        ]);

        if (activitiesRes.ok) {
          setActivities(await activitiesRes.json());
        }
        if (candidatesRes.ok) {
          const data = await candidatesRes.json();
          setCandidates(data.candidates);
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
      
      const populated = activity.candidates
        .map(id => candidates.find(c => c._id === id))
        .filter(Boolean) as Candidate[];
      setSelectedCandidates(populated);
    } else {
      setEditingActivity(null);
      setTitle("");
      setSlug("");
      setSelectedCandidates([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingActivity(null);
    setTitle("");
    setSlug("");
    setSelectedCandidates([]);
  };

  const handleSave = async () => {
    if (!title || !slug) {
      addToast("Título y slug son obligatorios", "info");
      return;
    }

    const url = editingActivity ? `/api/activities/${editingActivity.slug}` : "/api/activities";
    const method = editingActivity ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          slug, 
          candidates: selectedCandidates.map(c => c._id) 
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

  const handleDelete = async (slugToDelete: string) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta actividad?")) return;

    try {
      const res = await fetch(`/api/activities/${slugToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setActivities(activities.filter((a) => a.slug !== slugToDelete));
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
              activities.map((activity) => (
                <ActivityCard 
                  key={activity._id} 
                  activity={activity} 
                  onEdit={openModal} 
                  onDelete={handleDelete} 
                />
              ))
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
            <TextField
              label="Slug Identificador"
              fullWidth
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
              helperText="Se usará en la URL: /feedback?activity={slug}"
              placeholder="ej: taller-bienvenida"
            />
            
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
