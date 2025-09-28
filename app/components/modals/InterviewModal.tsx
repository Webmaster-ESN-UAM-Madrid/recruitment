import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { IInterview } from "@/lib/models/interview";
import { IUser } from "@/lib/models/user";
import { ICandidate } from "@/lib/models/candidate";
import { SaveButton } from "../buttons/SaveButton";
import { CancelButton } from "../buttons/CancelButton";
import { CopyButton } from "../buttons/CopyButton";
import { LaunchButton } from "../buttons/LaunchButton";
import { useToast } from "../toasts/ToastContext";
import {
  TextField,
  Autocomplete,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup
} from "@mui/material";
import { useSession } from "next-auth/react";
import LoadingSpinner from "@/app/components/loaders/LoadingSpinner";
import AutoSizingTextField from "../AutoSizingTextField";

interface InterviewModalProps {
  interview: IInterview | null;
  users: IUser[];
  candidates: ICandidate[];
  onClose: () => void;
  onSave: (interview: Partial<IInterview>, events: Record<string, ICandidate["events"]>) => void;
}

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  width: 100%;
  max-width: 800px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const SectionTitle = styled.h3`
  margin: 20px 0 10px;
  font-size: 1.1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
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

const NotificationsContainer = styled.div``;

const NotificationRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin: 8px 0;

  strong {
    flex: 0 0 auto;
    min-width: 120px;
  }

  .MuiFormGroup-root {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  @media (max-width: 600px) {
    strong {
      flex: 0 0 100%;
      margin-bottom: 4px;
    }
    .MuiFormGroup-root {
      flex: 0 0 100%;
    }
  }
`;

const InterviewModal: React.FC<InterviewModalProps> = ({
  interview,
  users,
  candidates,
  onClose,
  onSave
}) => {
  const { addToast } = useToast();
  const { data: session } = useSession();
  const [date, setDate] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<ICandidate[]>([]);
  const [selectedInterviewers, setSelectedInterviewers] = useState<IUser[]>([]);
  const [online, setOnline] = useState(false);
  const [location, setLocation] = useState("");
  const [opinions, setOpinions] = useState<IInterview["opinions"]>({});
  const [events, setEvents] = useState<Record<string, ICandidate["events"]>>({});
  const [loading, setLoading] = useState(false);

  const eventNames = [
    "Welcome Meeting",
    "Welcome Days",
    "Integration Weekend",
    "Plataforma Local"
  ] as const;

  type EventName = (typeof eventNames)[number];

  type Status = "unset" | "present" | "delayed" | "absent" | "cancelled";

  const pad2 = (n: number) => (n < 10 ? "0" + n : "" + n);

  useEffect(() => {
    setLoading(true);
    const fetchInterview = async () => {
      if (interview?._id) {
        try {
          const response = await fetch(`/api/interviews/${interview._id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch interview data");
          }
          const latestInterview: IInterview = await response.json();

          const date = new Date(latestInterview.date);
          const year = date.getFullYear();
          const month = pad2(date.getMonth() + 1);
          const day = pad2(date.getDate());
          const hours = pad2(date.getHours());
          const minutes = pad2(date.getMinutes());

          setDate(`${year}-${month}-${day}T${hours}:${minutes}`);
          const populatedCandidates = latestInterview.candidates.filter(
            (c) => typeof c === "object"
          ) as ICandidate[];
          const populatedInterviewers = latestInterview.interviewers.filter(
            (i) => typeof i === "object"
          ) as IUser[];

          setSelectedCandidates(populatedCandidates);
          setSelectedInterviewers(populatedInterviewers);

          setOnline(latestInterview.online ?? false);
          setLocation(latestInterview.location || "");
          setOpinions(latestInterview.opinions || {});

          const initialEvents: Record<string, ICandidate["events"]> = {};
          populatedCandidates.forEach((c) => {
            initialEvents[c._id] = c.events || {
              "Welcome Meeting": false,
              "Welcome Days": false,
              "Integration Weekend": false,
              "Plataforma Local": false
            };
          });
          setEvents(initialEvents);
        } catch (error) {
          console.error(error);
          addToast("Error al cargar los datos de la entrevista", "error");
        } finally {
          setLoading(false);
        }
      }
    };

    if (interview) {
      fetchInterview();
    } else {
      setDate("");
      setSelectedCandidates([]);
      setSelectedInterviewers([]);
      setOnline(false);
      setLocation("");
      setOpinions({});
      setEvents({});
      setLoading(false);
    }
  }, [interview, users, candidates, addToast]);

  const handleSave = async () => {
    if (!session?.user?.id) {
      addToast("Error de autenticación.", "error");
      return;
    }

    if (
      !date ||
      (selectedCandidates.length === 0 && !Array.isArray(selectedCandidates)) ||
      (selectedInterviewers.length === 0 && !Array.isArray(selectedInterviewers))
    ) {
      addToast("Por favor, rellena todos los campos obligatorios.", "error");
      return;
    }

    try {
      let mergedOpinions: IInterview["opinions"] = {};

      // Only fetch and merge existing opinions when editing an existing interview
      if (interview?._id) {
        const response = await fetch(`/api/interviews/${interview._id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch latest interview data");
        }
        const latestInterview: IInterview = await response.json();
        const dbOpinions = latestInterview.opinions || {};
        mergedOpinions = JSON.parse(JSON.stringify(dbOpinions));
      }

      for (const candidate of selectedCandidates) {
        const candidateId = candidate._id;
        const localOpinion = opinions[candidateId];

        if (!mergedOpinions[candidateId]) {
          mergedOpinions[candidateId] = {
            interviewers: {},
            status: "unset",
            interviewNotified: false,
            interviewConfirmed: false
          };
        }

        if (localOpinion?.interviewers?.[session.user.id]) {
          if (!mergedOpinions[candidateId].interviewers) {
            mergedOpinions[candidateId].interviewers = {};
          }
          mergedOpinions[candidateId].interviewers[session.user.id] =
            localOpinion.interviewers[session.user.id];
        }

        if (localOpinion) {
          if (localOpinion.status && localOpinion.status !== "unset") {
            mergedOpinions[candidateId].status = localOpinion.status;
          }
          if (Object.prototype.hasOwnProperty.call(localOpinion, "interviewNotified")) {
            mergedOpinions[candidateId].interviewNotified = localOpinion.interviewNotified;
          }
          if (Object.prototype.hasOwnProperty.call(localOpinion, "interviewConfirmed")) {
            mergedOpinions[candidateId].interviewConfirmed = localOpinion.interviewConfirmed;
          }
        }
      }

      const interviewData: Partial<IInterview> = {
        date: new Date(date),
        candidates: selectedCandidates.map((c) => c._id),
        interviewers: selectedInterviewers.map((u) => u._id),
        online: online,
        location: location || "",
        opinions: mergedOpinions
      };

      await onSave(interviewData, events);
    } catch (error) {
      console.error("Error saving interview:", error);
      addToast("Error al guardar la entrevista. Por favor, inténtalo de nuevo.", "error");
    }
  };

  const handleOpinionChange = (candidateId: string, interviewerId: string, opinion: string) => {
    setOpinions((prev) => ({
      ...prev,
      [candidateId]: {
        ...(prev[candidateId] || {}),
        interviewers: {
          ...(prev[candidateId]?.interviewers || {}),
          [interviewerId]: { opinion }
        }
      }
    }));
  };

  const handleNotificationChange = (
    candidateId: string,
    field: "interviewNotified" | "interviewConfirmed"
  ) => {
    setOpinions((prev) => ({
      ...prev,
      [candidateId]: {
        ...(prev[candidateId] || {}),
        interviewers: prev[candidateId]?.interviewers || {},
        status: prev[candidateId]?.status || "unset",
        [field]: !(prev[candidateId]?.[field] || false)
      }
    }));
  };

  const handleStatusChange = (candidateId: string, status: Status) => {
    setOpinions((prev) => ({
      ...prev,
      [candidateId]: {
        ...(prev[candidateId] || {}),
        status
      }
    }));
  };

  const handleEventChange = (candidateId: string, eventName: keyof ICandidate["events"]) => {
    setEvents((prev) => {
      const currentStatus = prev[candidateId]?.[eventName];
      let newStatus: boolean | null;
      if (currentStatus === false) {
        newStatus = true;
      } else if (currentStatus === true) {
        newStatus = null;
      } else {
        // currentStatus is null or undefined
        newStatus = false;
      }
      return {
        ...prev,
        [candidateId]: {
          ...(prev[candidateId] || {}),
          [eventName]: newStatus
        }
      };
    });
  };

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Form>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <FormRow>
            <DateField>
              <TextField
                label="Fecha y Hora"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </DateField>
            <FormatField>
              <FieldTitle>Formato</FieldTitle>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  value={online ? "online" : "presencial"}
                  onChange={(e) => setOnline(e.target.value === "online")}
                >
                  <FormControlLabel value="presencial" control={<Radio />} label="Presencial" />
                  <FormControlLabel value="online" control={<Radio />} label="Online" />
                </RadioGroup>
              </FormControl>
            </FormatField>
          </FormRow>

          <FormField>
            {isValidUrl(location) ? (
              <TextField
                label="Ubicación"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
                placeholder={online ? "Link de la reunión" : "Lugar de la entrevista"}
                style={{ paddingRight: 0 }}
                InputProps={{
                  endAdornment: (
                    <>
                      <CopyButton content={location} iconSize={20} style={{ marginRight: 8 }} />
                      <LaunchButton href={location} iconSize={20} style={{ marginRight: 8 }} />
                    </>
                  )
                }}
              />
            ) : (
              <TextField
                label="Ubicación"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
                placeholder={online ? "Link de la reunión" : "Lugar de la entrevista"}
              />
            )}
          </FormField>

          <FormField>
            <Autocomplete
              multiple
              options={candidates}
              getOptionLabel={(o) => o.name}
              value={selectedCandidates}
              onChange={(_, v) => setSelectedCandidates(v)}
              renderInput={(params) => (
                <TextField {...params} label="Candidatos" placeholder="Selecciona candidatos" />
              )}
            />
          </FormField>

          <FormField>
            <Autocomplete
              multiple
              options={users}
              getOptionLabel={(o) => o.name}
              value={selectedInterviewers}
              onChange={(_, v) => setSelectedInterviewers(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Entrevistadores"
                  placeholder="Selecciona entrevistadores"
                />
              )}
            />
          </FormField>

          {selectedCandidates.length > 0 && selectedInterviewers.length > 0 && (
            <>
              <NotificationsContainer>
                <SectionTitle>Notificaciones</SectionTitle>
                {selectedCandidates.map((candidate) => (
                  <NotificationRow key={candidate._id}>
                    <strong>{candidate.name}:</strong>
                    <FormGroup row>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={opinions[candidate._id]?.interviewNotified || false}
                            onChange={() =>
                              handleNotificationChange(candidate._id, "interviewNotified")
                            }
                          />
                        }
                        label="Entrevista Notificada"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={opinions[candidate._id]?.interviewConfirmed || false}
                            onChange={() =>
                              handleNotificationChange(candidate._id, "interviewConfirmed")
                            }
                          />
                        }
                        label="Entrevista Confirmada"
                      />
                    </FormGroup>
                  </NotificationRow>
                ))}
              </NotificationsContainer>

              {selectedCandidates.map((candidate) => (
                <div key={candidate._id}>
                  <SectionTitle>
                    Feedback para {candidate.name}
                    <CopyButton content={candidate.email} iconSize={16} />
                    <LaunchButton href={`/profile/${candidate._id}`} iconSize={16} />
                  </SectionTitle>

                  <FormControl component="fieldset" fullWidth margin="normal">
                    <RadioGroup
                      row
                      value={opinions[candidate._id]?.status || "unset"}
                      onChange={(e) => handleStatusChange(candidate._id, e.target.value as Status)}
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
                              checked={events[candidate._id]?.[ev] === true}
                              indeterminate={events[candidate._id]?.[ev] === null}
                              onChange={() => handleEventChange(candidate._id, ev)}
                            />
                          }
                          label={ev}
                        />
                      ))}
                    </FormGroup>
                  </FormControl>

                  {selectedInterviewers.map((interviewer) => {
                    const isOwner = session?.user?.id === interviewer._id;
                    return (
                      <FormField key={interviewer._id}>
                        {isOwner ? (
                          <TextField
                            label={`Opinión de ${interviewer.name}`}
                            multiline
                            value={
                              opinions[candidate._id]?.interviewers?.[interviewer._id]?.opinion ||
                              ""
                            }
                            onChange={(e) =>
                              handleOpinionChange(candidate._id, interviewer._id, e.target.value)
                            }
                            fullWidth
                            margin="normal"
                            InputProps={{
                              sx: {
                                "& textarea": {
                                  overflow: "hidden",
                                  resize: "none",
                                  minHeight: "72px"
                                }
                              }
                            }}
                          />
                        ) : (
                          <AutoSizingTextField
                            label={`Opinión de ${interviewer.name}`}
                            value={
                              opinions[candidate._id]?.interviewers?.[interviewer._id]?.opinion ||
                              ""
                            }
                            fullWidth
                            margin="normal"
                            disabled
                          />
                        )}
                      </FormField>
                    );
                  })}
                </div>
              ))}
            </>
          )}

          <ModalActions>
            <CancelButton onClick={onClose} />
            <SaveButton onClick={handleSave} />
          </ModalActions>
        </>
      )}
    </Form>
  );
};

export default InterviewModal;
