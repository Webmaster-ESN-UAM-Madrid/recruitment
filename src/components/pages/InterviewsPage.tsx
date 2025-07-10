"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AddButton } from "@/app/components/buttons/AddButton";
import Modal from "@/app/components/modals/Modal";
import { IInterview } from "@/lib/models/interview";
import { IUser } from "@/lib/models/user";
import { ICandidate } from "@/lib/models/candidate";
import InterviewCard from "@/app/components/interviews/InterviewCard";
import InterviewModal from "@/app/components/modals/InterviewModal";
import styled from "styled-components";
import { useToast } from "@/app/components/toasts/ToastContext";

const Header = styled.div`
  display: flex;
  align-items: start;
  gap: 24px;
  margin-bottom: 24px;
`;

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

const InterviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InterviewsPage = () => {
  const [interviews, setInterviews] = useState<IInterview[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [candidates, setCandidates] = useState<ICandidate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<IInterview | null>(null);
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [interviewsRes, usersRes, candidatesRes] = await Promise.all([
        fetch("/api/interviews"),
        fetch("/api/users"),
        fetch("/api/candidates"),
      ]);

      const interviewsData = await interviewsRes.json();
      const usersData = await usersRes.json();
      const candidatesData = await candidatesRes.json();

      setInterviews(interviewsData);
      setUsers(usersData);
      setCandidates(candidatesData);
    } catch (error) {
      console.error("Error al cargar los datos:", error);
      addToast("Error al cargar los datos", "error");
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (interview: IInterview | null = null) => {
    setEditingInterview(interview);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setEditingInterview(null);
    setIsModalOpen(false)
  };

  const handleSave = async (interviewData: Partial<IInterview>) => {
    const isEditing = !!editingInterview;
    const url = isEditing ? `/api/interviews/${editingInterview?._id}` : '/api/interviews';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(interviewData),
      });

      if (res.ok) {
        addToast(`Entrevista ${isEditing ? 'actualizada' : 'creada'} correctamente`, 'success');
        closeModal();
        fetchData();
      } else {
        addToast("Error al guardar la entrevista", "error");
      }
    } catch (error) {
      console.error("Error al guardar la entrevista:", error);
      addToast("Error al guardar la entrevista", "error");
    }
  };

  const handleDelete = async (interviewId: string) => {
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        addToast('Entrevista eliminada correctamente', 'success');
        setInterviews(interviews.filter(interview => interview._id !== interviewId));
      } else {
        addToast('Error al eliminar la entrevista', 'error');
      }
    } catch (error) {
      console.error("Error al eliminar la entrevista:", error);
      addToast('Error al eliminar la entrevista', 'error');
    } finally {
      fetchData();
    }
  };

  return (
    <PageContainer>
      <Header>
        <h1>Entrevistas</h1>
        <AddButton onClick={() => openModal()} iconSize={20} />
      </Header>

      <Container>
        <InterviewContainer>
          {interviews.map((interview) => (
            <InterviewCard
            key={interview._id}
            interview={interview}
            users={users}
            candidates={candidates}
            onEdit={() => openModal(interview)}
            onDelete={handleDelete}
            />
          ))}
        </InterviewContainer>

        <Modal isOpen={isModalOpen} title={editingInterview ? "Editar Entrevista" : "Añadir Entrevista"}>
          <InterviewModal
            users={users}
            candidates={candidates}
            interview={editingInterview}
            onClose={closeModal}
            onSave={handleSave}
          />
        </Modal>
      </Container>
    </PageContainer>
  );
};

export default InterviewsPage;
