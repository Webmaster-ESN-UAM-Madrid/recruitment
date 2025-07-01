'use client';
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useParams } from 'next/navigation';

// --- Type Definitions ---
interface Candidate {
  _id: string;
  recruitmentId: string;
  name: string;
  email: string;
  alternateEmails: string[];
  photoUrl?: string;
  active: boolean;
  appliedAt: string;
  guide?: string; // Email of the guide
  interests: string[]; // Array of interest IDs
}

interface FormResponse {
  _id: string;
  formId: string;
  respondentEmail: string;
  responses: Map<string, string | number | boolean | object>;
  processed: boolean;
  createdAt: string;
}

// --- Styled Components ---
const PageContainer = styled.div`
  padding: 20px;
`;

const Section = styled.section`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const ProfileCard = styled.div`
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
`;

const Avatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-right: 20px;
  object-fit: cover;
`;

const InfoGroup = styled.div`
  margin-bottom: 10px;
`;

const Label = styled.span`
  font-weight: bold;
  margin-right: 5px;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 300px;
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  &:hover {
    background-color: #0056b3;
  }
`;

const ItemCard = styled.div`
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FormResponseCard = styled(ItemCard)`
  background-color: #f9f9f9;
`;

// --- Component ---
  const ProfilePage: React.FC = () => {
  const params = useParams<{ id: string }>();
  const [id, setId] = useState<string | undefined>(undefined);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editableName, setEditableName] = useState('');
  const [editableEmail, setEditableEmail] = useState('');
  const [editablePhotoUrl, setEditablePhotoUrl] = useState('');
  const [editableGuide, setEditableGuide] = useState<string | undefined>(undefined);
  const [recruiters, setRecruiters] = useState<{ email: string; name: string }[]>([]);
  const [interests, setInterests] = useState<{ _id: string; name: string; color: string }[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const defaultAvatar = '/default-avatar.jpg'; // Path to your default avatar

  const fetchRecruiters = useCallback(async () => {
    const res = await fetch('/api/admin/recruiters');
    if (res.ok) {
      const data = await res.json();
      setRecruiters(data);
    } else {
      console.error("Failed to fetch recruiters");
    }
  }, []);

  const fetchCandidate = useCallback(async () => {
    if (!id) return; // Ensure id is defined before fetching
    const res = await fetch(`/api/candidates/${id}`);
    if (res.ok) {
      const data = await res.json();
      setCandidate(data);
      setEditableName(data.name);
      setEditableEmail(data.email);
      setEditablePhotoUrl(data.photoUrl || defaultAvatar);
      setEditableGuide(data.guide || '');
      setSelectedInterests(data.interests || []);
    } else {
      console.error("Failed to fetch candidate");
    }
  }, [id, defaultAvatar]);

  const fetchInterests = useCallback(async () => {
    const res = await fetch('/api/admin/interests');
    if (res.ok) {
      const data = await res.json();
      setInterests(data);
    } else {
      console.error("Failed to fetch interests");
    }
  }, []);

  const fetchFormResponses = useCallback(async () => {
    if (!id) return; // Ensure id is defined before fetching
    const res = await fetch(`/api/forms/candidate/${id}`);
    if (res.ok) {
      const data = await res.json();
      // Convert the plain object 'responses' back into a Map
      const processedData = data.map((item: FormResponse) => ({
        ...item,
        responses: new Map(Object.entries(item.responses || {})),
      }));
      setFormResponses(processedData);
    } else {
      console.error("Failed to fetch form responses");
    }
  }, [id]);

  useEffect(() => {
    if (params?.id) {
      setId(params.id);
    }
  }, [params]);

  useEffect(() => {
    if (id) {
      fetchCandidate();
      fetchFormResponses();
      fetchRecruiters();
      fetchInterests();
    }
  }, [id, fetchCandidate, fetchFormResponses, fetchRecruiters, fetchInterests]);

  const handleSave = async () => {
    if (!candidate) return;

    const updatedCandidate = {
      name: editableName,
      email: editableEmail,
      photoUrl: editablePhotoUrl === defaultAvatar ? null : editablePhotoUrl, // Save null if default
      guide: editableGuide === '' ? null : editableGuide,
      interests: selectedInterests,
    };

    const res = await fetch(`/api/candidates/${candidate._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedCandidate),
    });

    if (res.ok) {
      fetchCandidate(); // Refresh data
      setIsEditing(false);
    } else {
      const data = await res.json();
      alert(`Failed to update candidate: ${data.message}`);
    }
  };

  if (!id || !candidate) {
    return <PageContainer>Loading candidate profile...</PageContainer>;
  }

  return (
    <PageContainer>
      <h1>Candidate Profile: {candidate.name}</h1>

      <Section>
        <SectionTitle>Candidate Information</SectionTitle>
        <ProfileCard>
          <Avatar src={editablePhotoUrl} alt="Candidate Avatar" onError={(e) => (e.currentTarget.src = defaultAvatar)} />
          <div>
            <InfoGroup>
              <Label>Name:</Label>
              {isEditing ? (
                <Input type="text" value={editableName} onChange={(e) => setEditableName(e.target.value)} />
              ) : (
                <span>{candidate.name}</span>
              )}
            </InfoGroup>
            <InfoGroup>
              <Label>Email:</Label>
              {isEditing ? (
                <Input type="email" value={editableEmail} onChange={(e) => setEditableEmail(e.target.value)} />
              ) : (
                <span>{candidate.email}</span>
              )}
            </InfoGroup>
            <InfoGroup>
              <Label>Photo URL:</Label>
              {isEditing ? (
                <Input type="text" value={editablePhotoUrl} onChange={(e) => setEditablePhotoUrl(e.target.value)} />
              ) : (
                <span>{candidate.photoUrl || 'N/A'}</span>
              )}
            </InfoGroup>
            <InfoGroup>
              <Label>Recruitment ID:</Label><span>{candidate.recruitmentId}</span>
            </InfoGroup>
            <InfoGroup>
              <Label>Applied At:</Label><span>{new Date(candidate.appliedAt).toLocaleString()}</span>
            </InfoGroup>
            <InfoGroup>
              <Label>Status:</Label><span>{candidate.active ? 'Active' : 'Inactive'}</span>
            </InfoGroup>
            <InfoGroup>
              <Label>Guide:</Label>
              {isEditing ? (
                <select value={editableGuide} onChange={(e) => setEditableGuide(e.target.value)}>
                  <option value="">Select a Guide</option>
                  {recruiters.map((recruiter) => (
                    <option key={recruiter.email} value={recruiter.email}>
                      {recruiter.name} ({recruiter.email})
                    </option>
                  ))}
                </select>
              ) : (
                <span>{candidate.guide || 'N/A'}</span>
              )}
            </InfoGroup>
            <InfoGroup>
              <Label>Interests:</Label>
              {isEditing ? (
                <select
                  multiple
                  value={selectedInterests}
                  onChange={(e) =>
                    setSelectedInterests(
                      Array.from(e.target.selectedOptions, (option) => option.value)
                    )
                  }
                >
                  {interests.map((interest) => (
                    <option key={interest._id} value={interest._id}>
                      {interest.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span>
                  {candidate.interests && candidate.interests.length > 0
                    ? candidate.interests
                        .map((id) => interests.find((i) => i._id === id)?.name || '')
                        .filter(Boolean)
                        .join(', ')
                    : 'N/A'}
                </span>
              )}
            </InfoGroup>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            ) : (
              <>
                <Button onClick={handleSave}>Save Changes</Button>
                <Button onClick={() => setIsEditing(false)} style={{ marginLeft: '10px', backgroundColor: '#dc3545' }}>Cancel</Button>
              </>
            )}
          </div>
        </ProfileCard>
      </Section>

      <Section>
        <SectionTitle>Form Responses</SectionTitle>
        {formResponses.length > 0 ? (
          formResponses.map(response => (
            <FormResponseCard key={response._id}>
              <p><strong>Form ID:</strong> {response.formId}</p>
              <p><strong>Respondent Email:</strong> {response.respondentEmail}</p>
              <p><strong>Submitted At:</strong> {new Date(response.createdAt).toLocaleString()}</p>
              <div>
                <strong>Responses:</strong>
                <ul>
                  {Array.from(response.responses.entries()).map(([key, value]) => (
                    <li key={key}><strong>{key}:</strong> {JSON.stringify(value)}</li>
                  ))}
                </ul>
              </div>
            </FormResponseCard>
          ))
        ) : (
          <p>No form responses found for this candidate.</p>
        )}
      </Section>
    </PageContainer>
  );
};

export default ProfilePage;