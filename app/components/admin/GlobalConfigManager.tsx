'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from "react";
import styled from 'styled-components';
import { TextField, Autocomplete } from '@mui/material';

import { SaveButton } from '@/app/components/buttons/SaveButton';
import { AddButton } from '@/app/components/buttons/AddButton';
import { DeleteButton } from '@/app/components/buttons/DeleteButton';
import { EditButton } from '@/app/components/buttons/EditButton';
import { CancelButton } from '@/app/components/buttons/CancelButton';
import { useToast } from '@/app/components/toasts/ToastContext';
import Modal from '@/app/components/modals/Modal';
import FormPreview from '@/app/components/FormPreview';
import GoogleFormsConnect from './GoogleFormsConnect';

interface Recruiter {
  _id: string;
  email: string;
  name: string;
  image: string;
}

interface Committee {
  _id: string;
  name: string;
  color: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface ConnectedForm {
  _id: string;
  formIdentifier: string;
  canCreateUsers: boolean;
  structure: string;
  fieldMappings: { [key: string]: string };
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Container = styled.div`
  background-color: #ffffff;
  border-radius: var(--border-radius-md);
  padding: 32px;
  margin: 20px auto;
  max-width: 1000px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
  font-family: 'Montserrat', sans-serif;
`;

const Subtitle = styled.h3`
  color: #333;
  margin-top: 50px;
  margin-bottom: 15px;
  font-family: 'Montserrat', sans-serif;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 50px 1fr 1.5fr 80px;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  font-weight: bold;
  border-bottom: 2px solid #ccc;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 50px 1fr 1.5fr 80px;
  gap: 10px;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
`;

const RecruiterInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: -10px;
`;

const GlobalConfigManager = () => {
  const [currentRecruitment, setCurrentRecruitment] = useState('');
  const [recruitmentPhase, setRecruitmentPhase] = useState('');
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [newRecruiterEmail, setNewRecruiterEmail] = useState('');
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [committeeName, setCommitteeName] = useState('');
  const [committeeColor, setCommitteeColor] = useState('#000000');
  const [users, setUsers] = useState<User[]>([]);
  const [connectedForms, setConnectedForms] = useState<ConnectedForm[]>([]);
  const [isFormPreviewModalOpen, setIsFormPreviewModalOpen] = useState(false);
  const [isFormOnboardingModalOpen, setIsFormOnboardingModalOpen] = useState(false);
  const [selectedFormForPreview, setSelectedFormForPreview] = useState<ConnectedForm | null>(null);

  const { addToast } = useToast();

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCurrentRecruitment(data.currentRecruitment);
      setRecruitmentPhase(data.recruitmentPhase);
      setRecruiters(data.recruiters);
    } catch (e) {
      addToast(`Error al cargar la configuración: ${(e as Error).message}`, 'error');
    }
  }, [addToast]);

  const fetchCommittees = useCallback(async () => {
    try {
      const response = await fetch('/api/committees');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCommittees(data);
    } catch (e) {
      addToast(`Error al cargar los comités: ${(e as Error).message}`, 'error');
    }
  }, [addToast]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.filter((user: User) => user.email.endsWith('@esnuam.org')));
    } catch (err) {
      console.error('No se pudieron cargar los usuarios', err);
    }
  }, []);

  const fetchConnectedForms = useCallback(async () => {
    try {
      const response = await fetch('/api/forms');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setConnectedForms(data);
    } catch (e) {
      addToast(`Error al cargar los formularios conectados: ${(e as Error).message}`, 'error');
    }
  }, [addToast]);

  useEffect(() => {
    fetchConfig();
    fetchCommittees();
    fetchUsers();
    fetchConnectedForms();
  }, [fetchConfig, fetchCommittees, fetchUsers, fetchConnectedForms]);

  const handleUpdateDetails = async () => {
    try {
      const response = await fetch('/api/config/update-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentRecruitment, recruitmentPhase }),
      });
      if (response.ok) {
        addToast('Configuración actualizada correctamente', 'success');
        fetchConfig();
      } else {
        addToast('No se pudo actualizar la configuración', 'error');
      }
    } catch (e) {
      addToast(`Error al actualizar la configuración: ${(e as Error).message}`, 'error');
    }
  };

  const handleAddRecruiter = async () => {
    const sanitizedEmail = newRecruiterEmail.trim().toLowerCase();
    if (!isValidEmail(sanitizedEmail)) {
      addToast('Correo electrónico inválido', 'error');
      return;
    }
    try {
      const response = await fetch('/api/config/recruiters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sanitizedEmail }),
      });
      if (response.ok) {
        addToast('Reclutador añadido correctamente', 'success');
        setNewRecruiterEmail('');
        fetchConfig();
      } else {
        addToast('No se pudo añadir el reclutador', 'error');
      }
    } catch (e) {
      addToast(`Error al añadir reclutador: ${(e as Error).message}`, 'error');
    }
  };

  const handleRemoveRecruiter = async (email: string) => {
    try {
      const response = await fetch('/api/config/recruiters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        addToast('Reclutador eliminado correctamente', 'success');
        fetchConfig();
      } else {
        addToast('No se pudo eliminar el reclutador', 'error');
      }
    } catch (e) {
      addToast(`Error al eliminar reclutador: ${(e as Error).message}`, 'error');
    }
  };

  const handleSaveCommittee = async () => {
    const committeeData = {
      name: committeeName,
      color: committeeColor,
      _id: editingCommittee?._id,
    };

    const url = committeeData._id ? `/api/committees/${committeeData._id}` : '/api/committees';
    const method = committeeData._id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: committeeData.name, color: committeeData.color }),
      });
      if (response.ok) {
        addToast('Comité guardado correctamente', 'success');
        fetchCommittees();
        setIsCommitteeModalOpen(false);
      } else {
        addToast('No se pudo guardar el comité', 'error');
      }
    } catch (e) {
      addToast(`Error al guardar comité: ${(e as Error).message}`, 'error');
    }
  };

  const handleEditCommittee = (committee: Committee) => {
    setEditingCommittee(committee);
    setCommitteeName(committee.name);
    setCommitteeColor(committee.color);
    setIsCommitteeModalOpen(true);
  };

  const handleDeleteCommittee = async (id: string) => {
    try {
      const response = await fetch(`/api/committees/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        addToast('Comité eliminado correctamente', 'success');
        fetchCommittees();
      } else {
        addToast('No se pudo eliminar el comité', 'error');
      }
    } catch (e) {
      addToast(`Error al eliminar comité: ${(e as Error).message}`, 'error');
    }
  };

  const handleDeleteForm = async (id: string) => {
    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        addToast('Formulario eliminado correctamente', 'success');
        fetchConnectedForms();
      } else {
        addToast('No se pudo eliminar el formulario', 'error');
      }
    } catch (e) {
      addToast(`Error al eliminar formulario: ${(e as Error).message}`, 'error');
    }
  };

  const handleSaveMappings = async (mappings: Map<string, string>) => {
    if (!selectedFormForPreview) return;

    try {
      const response = await fetch(`/api/forms/${selectedFormForPreview._id}/map`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldMappings: Object.fromEntries(mappings) }),
      });

      if (response.ok) {
        addToast('Formulario actualizado correctamente', 'success');
        setIsFormPreviewModalOpen(false);
      } else {
        addToast('No se pudo actualizar el formulario', 'error');
      }
    } catch (e) {
      addToast(`Error al actualizar el formulario: ${(e as Error).message}`, 'error');
    }
  };

  const recruitmentPhaseSuggestions = ['registro', 'entrevistas', 'welcome days'];

  return (
    <Container>
      <Title>Configuración Global</Title>

      <Subtitle>Detalles de Reclutamiento</Subtitle>
      <TextField
        label="ID de Reclutamiento Actual"
        value={currentRecruitment}
        onChange={(e) => setCurrentRecruitment(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Autocomplete
        options={recruitmentPhaseSuggestions}
        value={recruitmentPhase}
        onChange={(_, newValue) => setRecruitmentPhase(newValue || '')}
        renderInput={(params) => <TextField {...params} label="Fase de Reclutamiento" fullWidth margin="normal" />}
      />
      <ButtonContainer style={{ marginTop: 5 }}>
        <SaveButton onClick={handleUpdateDetails} />
      </ButtonContainer>

      <Subtitle>Reclutadores</Subtitle>
      <RecruiterInputContainer>
        <Autocomplete
          options={users.map(u => u.email)}
          freeSolo
          value={newRecruiterEmail}
          onChange={(_, newValue) => setNewRecruiterEmail(newValue || '')}
          onInputChange={(_, newInput) => setNewRecruiterEmail(newInput)}
          renderInput={(params) => <TextField {...params} label="Añadir reclutador por correo" fullWidth margin="normal" />}
          sx={{ flexGrow: 1 }}
        />
        <AddButton
          onClick={handleAddRecruiter}
          disabled={!isValidEmail(newRecruiterEmail)}
          iconSize={28}
          showSpinner={true}
          style={{ marginTop: 16, marginBottom: 8 }}
        />
      </RecruiterInputContainer>

      <div style={{ marginTop: '20px' }}>
        <TableHeader>
          <div /> {/* For avatar */}
          <div>Nombre</div>
          <div>Correo</div>
          <div>Acciones</div>
        </TableHeader>
        {recruiters.map((recruiter) => (
          <TableRow key={recruiter._id}>
            <div>
              <Image src={recruiter.image} alt="Profile" width="40" height="40" style={{ borderRadius: "100%" }} />
            </div>
            <div>{recruiter.name}</div>
            <div>{recruiter.email}</div>
            <div>
              <DeleteButton onClick={() => handleRemoveRecruiter(recruiter.email)} />
            </div>
          </TableRow>
        ))}
      </div>

      <Subtitle>Comités</Subtitle>
      <ButtonContainer>
        <AddButton onClick={() => {
          setEditingCommittee(null);
          setCommitteeName('');
          setCommitteeColor('#000000');
          setIsCommitteeModalOpen(true);
        }} />
      </ButtonContainer>

      <div style={{ marginTop: '20px' }}>
        <TableHeader style={{ gridTemplateColumns: '1fr 150px 120px' }}>
          <div>Nombre</div>
          <div>Color</div>
          <div>Acciones</div>
        </TableHeader>
        {committees.map((committee) => (
          <TableRow key={committee._id} style={{ gridTemplateColumns: '1fr 150px 120px' }}>
            <div>{committee.name}</div>
            <div style={{ backgroundColor: committee.color, width: '30px', height: '30px', borderRadius: '50%' }} />
            <ButtonContainer>
              <EditButton onClick={() => handleEditCommittee(committee)} />
              <DeleteButton onClick={() => handleDeleteCommittee(committee._id)} />
            </ButtonContainer>
          </TableRow>
        ))}
      </div>

      <Subtitle>Formularios Conectados</Subtitle>
      <AddButton onClick={() => setIsFormOnboardingModalOpen(true)} />

      <div style={{ marginTop: '20px' }}>
        <TableHeader style={{ gridTemplateColumns: '1fr 150px 120px' }}>
          <div>Identificador</div>
          <div>Crear Usuarios</div>
          <div>Acciones</div>
        </TableHeader>
        {connectedForms.map((form) => (
          <TableRow key={form._id} style={{ gridTemplateColumns: '1fr 150px 120px' }}>
            <div>{form.formIdentifier}</div>
            <div>{form.canCreateUsers ? 'Sí' : 'No'}</div>
            <ButtonContainer>
              <EditButton onClick={() => {
                setSelectedFormForPreview(form);
                setIsFormPreviewModalOpen(true);
              }} />
              <DeleteButton onClick={() => handleDeleteForm(form._id)} />
            </ButtonContainer>
          </TableRow>
        ))}
      </div>

      <Modal
        isOpen={isCommitteeModalOpen}
        onClose={() => setIsCommitteeModalOpen(false)}
        title={editingCommittee ? 'Editar Comité' : 'Añadir Comité'}
        width='xs'
      >
        <TextField
          label="Nombre del comité"
          value={committeeName}
          onChange={(e) => setCommitteeName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Color del comité"
          type="color"
          value={committeeColor}
          onChange={(e) => setCommitteeColor(e.target.value)}
          fullWidth
          margin="normal"
        />
        <ButtonContainer style={{ marginTop: 20, justifyContent: 'flex-end' }}>
          <CancelButton onClick={() => setIsCommitteeModalOpen(false)} />
          <SaveButton onClick={handleSaveCommittee} />
        </ButtonContainer>
      </Modal>

      {selectedFormForPreview && (
        <Modal
          isOpen={isFormPreviewModalOpen}
          onClose={() => setIsFormPreviewModalOpen(false)}
          title={`Formulario: ${selectedFormForPreview.formIdentifier}`}
        >
          <FormPreview
            formStructure={selectedFormForPreview.structure}
            responses={new Map()}
            isEditing={true}
            initialMappings={new Map(Object.entries(selectedFormForPreview.fieldMappings || {}))}
            onSaveMappings={handleSaveMappings}
            onCancelEdit={() => setIsFormPreviewModalOpen(false)}
          />
        </Modal>
      )}

      <Modal
        isOpen={isFormOnboardingModalOpen}
        onClose={() => setIsFormOnboardingModalOpen(false)}
        title="Añadir Nuevo Formulario"
      >
        <GoogleFormsConnect
          onClose={() => setIsFormOnboardingModalOpen(false)}
          onFormConnected={fetchConnectedForms}
        />
      </Modal>
    </Container>
  );
};

export default GlobalConfigManager;