import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { IInterview } from '@/lib/models/interview';
import { IUser } from '@/lib/models/user';
import { ICandidate } from '@/lib/models/candidate';
import { SaveButton } from '../buttons/SaveButton';
import { CancelButton } from '../buttons/CancelButton';
import { useToast } from '../toasts/ToastContext';
import { TextField, Autocomplete, Chip, FormControl, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface InterviewModalProps {
  interview: IInterview | null;
  users: IUser[];
  candidates: ICandidate[];
  onClose: () => void;
  onSave: (interview: Partial<IInterview>) => void;
}

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h3`
  margin-top: 20px;
  margin-bottom: 10px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const InterviewModal: React.FC<InterviewModalProps> = ({ interview, users, candidates, onClose, onSave }) => {
  const { addToast } = useToast();
  const { data: session } = useSession();
  const [date, setDate] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<ICandidate[]>([]);
  const [selectedInterviewers, setSelectedInterviewers] = useState<IUser[]>([]);
  const [opinions, setOpinions] = useState<IInterview['opinions']>({});

  useEffect(() => {
    if (interview) {
      setDate(new Date(interview.date).toISOString().substring(0, 16)); // Format for datetime-local
      setSelectedCandidates(candidates.filter(c => interview.candidates.includes(c._id)));
      setSelectedInterviewers(users.filter(u => interview.interviewers.includes(u._id)));
      setOpinions(interview.opinions || {});
    } else {
      setDate('');
      setSelectedCandidates([]);
      setSelectedInterviewers([]);
      setOpinions({});
    }
  }, [interview, users, candidates]);

  const handleSave = async () => {
    if (!date || selectedCandidates.length === 0 || selectedInterviewers.length === 0) {
      addToast('Por favor, rellena todos los campos obligatorios', 'error');
      return;
    }

    const interviewData: Partial<IInterview> = {
      date: new Date(date),
      candidates: selectedCandidates.map(c => c._id),
      interviewers: selectedInterviewers.map(u => u._id),
      opinions: opinions,
    };

    await onSave(interviewData);
  };

  const handleOpinionChange = (candidateId: string, interviewerId: string, opinion: string) => {
    setOpinions(prevOpinions => ({
      ...prevOpinions,
      [candidateId]: {
        ...(prevOpinions[candidateId] || {}),
        interviewers: {
          ...(prevOpinions[candidateId]?.interviewers || {}),
          [interviewerId]: { opinion },
        },
      },
    }));
  };

  const handleStatusChange = (candidateId: string, status: "unset" | "present" | "delayed" | "absent" | "cancelled") => {
    setOpinions(prevOpinions => ({
      ...prevOpinions,
      [candidateId]: {
        ...(prevOpinions[candidateId] || {}),
        status: status,
      },
    }));
  };

  return (
    <Form>
      <FormField>
        <TextField
          label="Fecha y Hora"
          type="datetime-local"
          value={date}
          onChange={e => setDate(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </FormField>
      <FormField>
        <Autocomplete
          multiple
          options={candidates}
          getOptionLabel={(option) => option.name}
          value={selectedCandidates}
          onChange={(_, newValue) => setSelectedCandidates(newValue)}
          renderInput={(params) => <TextField {...params} label="Candidatos" placeholder="Selecciona candidatos" />}
          renderValue={(selected) => (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {selected.map((option) => (
                <Chip
                  key={option._id}
                  label={option.name}
                  onDelete={() =>
                    setSelectedCandidates(selectedCandidates.filter(c => c._id !== option._id))
                  }
                />
              ))}
            </div>
          )}
        />
      </FormField>
      <FormField>
        <Autocomplete
          multiple
          options={users}
          getOptionLabel={(option) => option.name}
          value={selectedInterviewers}
          onChange={(_, newValue) => setSelectedInterviewers(newValue)}
          renderInput={(params) => <TextField {...params} label="Entrevistadores" placeholder="Selecciona entrevistadores" />}
          renderValue={(selected) => (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {selected.map((option) => (
                <Chip
                  key={option._id}
                  label={option.name}
                  onDelete={() =>
                    setSelectedCandidates(selectedCandidates.filter(c => c._id !== option._id))
                  }
                />
              ))}
            </div>
          )}
        />
      </FormField>

      {selectedCandidates.length > 0 && selectedInterviewers.length > 0 && (
        <div>
          {selectedCandidates.map(candidate => (
            <div key={candidate._id}>
              <SectionTitle>Feedback para <Link href={`/profile/${candidate._id}`}>{candidate.name}</Link></SectionTitle>
              <FormControl component="fieldset" fullWidth margin="normal">
                <RadioGroup
                  row
                  value={opinions[candidate._id]?.status || "unset"}
                  onChange={e => handleStatusChange(candidate._id, e.target.value as "unset" | "present" | "delayed" | "absent" | "cancelled")}
                >
                  <FormControlLabel value="present" control={<Radio />} label="Presente" />
                  <FormControlLabel value="delayed" control={<Radio />} label="Retrasado" />
                  <FormControlLabel value="absent" control={<Radio />} label="Ausente" />
                  <FormControlLabel value="cancelled" control={<Radio />} label="Cancelado" />
                </RadioGroup>
              </FormControl>
              {selectedInterviewers.map(interviewer => (
                <FormField key={interviewer._id}>
                  <TextField
                    label={`Opinión de ${interviewer.name}`}
                    multiline
                    rows={3}
                    value={opinions[candidate._id]?.interviewers?.[interviewer._id]?.opinion || ''}
                    onChange={e => handleOpinionChange(candidate._id, interviewer._id, e.target.value)}
                    fullWidth
                    margin="normal"
                    disabled={session?.user?.id !== interviewer._id} // Disable if not current user
                  />
                </FormField>
              ))}
            </div>
          ))}
        </div>
      )}

      <ModalActions>
        <CancelButton onClick={onClose} />
        <SaveButton onClick={handleSave} />
      </ModalActions>
    </Form>
  );
};

export default InterviewModal;