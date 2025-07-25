import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { IInterview } from '@/lib/models/interview';
import { IUser } from '@/lib/models/user';
import { ICandidate } from '@/lib/models/candidate';
import { SaveButton } from '../buttons/SaveButton';
import { CancelButton } from '../buttons/CancelButton';
import { useToast } from '../toasts/ToastContext';
import { TextField, Autocomplete, FormControl, RadioGroup, FormControlLabel, Radio, Checkbox, FormGroup } from '@mui/material';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface InterviewModalProps {
  interview: IInterview | null;
  users: IUser[];
  candidates: ICandidate[];
  onClose: () => void;
  onSave: (interview: Partial<IInterview>, events: Record<string, ICandidate['events']>) => void;
}

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  width: 100%;
  max-width: 800px;
  box-sizing: border-box;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const SectionTitle = styled.h3`
  margin: 20px 0 10px;
  font-size: 1.1rem;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  flex-wrap: wrap;
`;

const FormRow = styled.div`
  display: flex;
  gap: 48px;
  align-items: flex-start;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const DateField = styled(FormField)`
  flex: 1;
  max-width: 300px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const FormatField = styled(FormField)`
  flex: 1;
  margin-top: -7px;
`;

const FieldTitle = styled.div`
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.8rem;
  margin-bottom: 8px;
`;

const InterviewModal: React.FC<InterviewModalProps> = ({ interview, users, candidates, onClose, onSave }) => {
  const { addToast } = useToast();
  const { data: session } = useSession();
  const [date, setDate] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<ICandidate[]>([]);
  const [selectedInterviewers, setSelectedInterviewers] = useState<IUser[]>([]);
  const [online, setOnline] = useState(false);
  const [opinions, setOpinions] = useState<IInterview['opinions']>({});
  const [events, setEvents] = useState<Record<string, ICandidate['events']>>({});

  const eventNames = [
    'Welcome Meeting',
    'Welcome Days',
    'Integration Weekend',
    'Plataforma Local',
  ] as const;

  type EventName = typeof eventNames[number];

  type Status = 'unset' | 'present' | 'delayed' | 'absent' | 'cancelled';


  useEffect(() => {
    if (interview) {
      setDate(new Date(interview.date).toISOString().substring(0, 16));
      setSelectedCandidates(candidates.filter(c => interview.candidates.includes(c._id)));
      setSelectedInterviewers(users.filter(u => interview.interviewers.includes(u._id)));
      setOnline(interview.online ?? false);
      setOpinions(interview.opinions || {});
      const initialEvents: Record<string, ICandidate['events']> = {};
      candidates.forEach(candidate => {
        if (interview.candidates.includes(candidate._id)) {
          initialEvents[candidate._id] = candidate.events || {
            'Welcome Meeting': false,
            'Welcome Days': false,
            'Integration Weekend': false,
            'Plataforma Local': false,
          };
        }
      });
      setEvents(initialEvents);
    } else {
      setDate('');
      setSelectedCandidates([]);
      setSelectedInterviewers([]);
      setOnline(false);
      setOpinions({});
      setEvents({});
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
      online: online,
      opinions: opinions,
    };

    await onSave(interviewData, events);
  };

  const handleOpinionChange = (candidateId: string, interviewerId: string, opinion: string) => {
    setOpinions(prev => ({
      ...prev,
      [candidateId]: {
        ...(prev[candidateId] || {}),
        interviewers: {
          ...(prev[candidateId]?.interviewers || {}),
          [interviewerId]: { opinion },
        },
      },
    }));
  };

  const handleStatusChange = (candidateId: string, status: Status) => {
    setOpinions(prev => ({
      ...prev,
      [candidateId]: {
        ...(prev[candidateId] || {}),
        status,
      },
    }));
  };

  const handleEventChange = (candidateId: string, eventName: keyof ICandidate['events']) => {
    setEvents(prev => ({
      ...prev,
      [candidateId]: {
        ...(prev[candidateId] || {}),
        [eventName]: !prev[candidateId]?.[eventName],
      },
    }));
  };

  return (
      <Form>
        <FormRow>
          <DateField>
            <TextField
                label="Fecha y Hora"
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
            />
          </DateField>
          <FormatField>
            <FieldTitle>Formato</FieldTitle>
            <FormControl component="fieldset">
              <RadioGroup row value={online ? "online" : "presencial"}
                          onChange={e => setOnline(e.target.value === "online")}>
                <FormControlLabel value="presencial" control={<Radio />} label="Presencial" />
                <FormControlLabel value="online" control={<Radio />} label="Online" />
              </RadioGroup>
            </FormControl>
          </FormatField>
        </FormRow>

        <FormField>
          <Autocomplete
              multiple
              options={candidates}
              getOptionLabel={o => o.name}
              value={selectedCandidates}
              onChange={(_, v) => setSelectedCandidates(v)}
              renderInput={params => <TextField {...params} label="Candidatos" placeholder="Selecciona candidatos" />}
          />
        </FormField>

        <FormField>
          <Autocomplete
              multiple
              options={users}
              getOptionLabel={o => o.name}
              value={selectedInterviewers}
              onChange={(_, v) => setSelectedInterviewers(v)}
              renderInput={params => <TextField {...params} label="Entrevistadores" placeholder="Selecciona entrevistadores" />}
          />
        </FormField>

        {selectedCandidates.length > 0 && selectedInterviewers.length > 0 && (
            <>
              {selectedCandidates.map(candidate => (
                  <div key={candidate._id}>
                    <SectionTitle>
                      Feedback para <Link href={`/profile/${candidate._id}`}>{candidate.name}</Link>
                    </SectionTitle>
                    <FormControl component="fieldset" fullWidth margin="normal">
                      <RadioGroup
                          row
                          value={opinions[candidate._id]?.status || 'unset'}
                          onChange={e => handleStatusChange(candidate._id, e.target.value as Status)}
                      >
                        <FormControlLabel value="present" control={<Radio />} label="Presente" />
                        <FormControlLabel value="delayed" control={<Radio />} label="Retrasado" />
                        <FormControlLabel value="absent" control={<Radio />} label="Ausente" />
                        <FormControlLabel value="cancelled" control={<Radio />} label="Cancelado" />
                      </RadioGroup>
                    </FormControl>
                    <FormControl component="fieldset" fullWidth margin="normal">
                      <FormGroup row>
                        {eventNames.map((ev: EventName) => (
                            <FormControlLabel
                                key={ev}
                                control={
                                  <Checkbox
                                      checked={events[candidate._id]?.[ev] || false}
                                      onChange={() => handleEventChange(candidate._id, ev)}
                                  />
                                }
                                label={ev}
                            />
                        ))}
                      </FormGroup>
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
                              disabled={session?.user?.id !== interviewer._id}
                          />
                        </FormField>
                    ))}
                  </div>
              ))}
            </>
        )}

        <ModalActions>
          <CancelButton onClick={onClose} />
          <SaveButton onClick={handleSave} />
        </ModalActions>
      </Form>
  );
};

export default InterviewModal;
