import Image from 'next/image';
import { useState, useEffect } from "react";
import { HexColorPicker } from 'react-colorful';
import styled from 'styled-components';

interface Recruiter {
  _id: string;
  email: string;
  name: string;
  image: string;
}

interface Committee {
  name: string;
  color: string;
}

const Container = styled.div`
  background-color: #ffffff;
  border-radius: var(--border-radius-md);
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 20px;
  font-family: 'Montserrat', sans-serif;
`;

const Subtitle = styled.h3`
  color: #333;
  margin-top: 25px;
  margin-bottom: 15px;
  font-family: 'Montserrat', sans-serif;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 10px;
  margin-top: 5px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius-md);
  font-family: 'Inter', sans-serif;
`;

const StyledLabel = styled.label`
  font-family: 'Inter', sans-serif;
  margin-bottom: 5px;
  display: block;
`;

const StyledButton = styled.button`
  background-color: var(--main-color); /* Primary button color */
  color: white;
  border: none;
  border-radius: var(--border-radius-md); /* Rounded corners for buttons */
  padding: 10px 20px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
  margin-right: 10px;

  &:hover {
    background-color: #0056b3; /* Darker variant of main color */
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(StyledButton)`
  background-color: #6c757d; /* Secondary button color */

  &:hover {
    background-color: #5a6268;
  }
`;

const RecruiterItem = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid #eee;
  padding: 10px;
  border-radius: var(--border-radius-md);
  margin-bottom: 10px;
  background-color: #f9f9f9;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  div {
    font-family: 'Inter', sans-serif;
  }
`;

const CommitteeList = styled.ul`
  list-style: none;
  padding: 0;
`;

const CommitteeItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
  border-radius: var(--border-radius-md);
  margin-bottom: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:last-child {
    border-bottom: none;
  }

  div {
    font-family: 'Inter', sans-serif;
  }
`;

const ColorBox = styled.div<{ color: string }>`
  width: 20px;
  height: 20px;
  background-color: ${(props) => props.color};
  border: 1px solid #ccc;
  margin-right: 10px;
  border-radius: var(--border-radius-md);
`;

const GlobalConfigManager = () => {
  const [currentRecruitment, setCurrentRecruitment] = useState('');
  const [recruitmentPhase, setRecruitmentPhase] = useState('');
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [newRecruiterEmail, setNewRecruiterEmail] = useState('');
  const [newCommitteeName, setNewCommitteeName] = useState('');
  const [newCommitteeColor, setNewCommitteeColor] = useState('#aabbcc');
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCurrentRecruitment(data.currentRecruitment);
      setRecruitmentPhase(data.recruitmentPhase);
      setRecruiters(data.recruiters);
      setCommittees(data.committees || []);
    } catch (e) {
      setError(`Failed to fetch config: ${(e as Error).message}`);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleUpdateDetails = async () => {
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/config/update-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentRecruitment, recruitmentPhase }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        fetchConfig(); // Re-fetch to ensure UI is up-to-date
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError(`Failed to update config: ${(e as Error).message}`);
    }
  };

  const handleAddRecruiter = async () => {
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/config/recruiters/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newRecruiterEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setNewRecruiterEmail('');
        fetchConfig(); // Re-fetch to update recruiter list
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError(`Failed to add recruiter: ${(e as Error).message}`);
    }
  };

  const handleRemoveRecruiter = async (email: string) => {
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/config/recruiters/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        fetchConfig(); // Re-fetch to update recruiter list
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError(`Failed to remove recruiter: ${(e as Error).message}`);
    }
  };

  const handleCommitteeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (editingCommittee) {
      // Update existing committee
      try {
        const response = await fetch('/api/config/committees/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originalName: editingCommittee.name, name: newCommitteeName, color: newCommitteeColor }),
        });
        const data = await response.json();
        if (response.ok) {
          setMessage(data.message);
          fetchConfig();
          setEditingCommittee(null);
          setNewCommitteeName('');
          setNewCommitteeColor('#aabbcc');
        } else {
          setError(data.message);
        }
      } catch (e) {
        setError(`Failed to update committee: ${(e as Error).message}`);
      }
    } else {
      // Add new committee
      if (committees.some(c => c.name === newCommitteeName)) {
        setError('Committee with this name already exists.');
        return;
      }
      try {
        const response = await fetch('/api/config/committees/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCommitteeName, color: newCommitteeColor }),
        });
        const data = await response.json();
        if (response.ok) {
          setMessage(data.message);
          fetchConfig();
          setNewCommitteeName('');
          setNewCommitteeColor('#aabbcc');
        } else {
          setError(data.message);
        }
      } catch (e) {
        setError(`Failed to add committee: ${(e as Error).message}`);
      }
    }
  };

  const handleEditCommittee = (committee: Committee) => {
    setEditingCommittee(committee);
    setNewCommitteeName(committee.name);
    setNewCommitteeColor(committee.color);
  };

  const handleDeleteCommittee = async (name: string) => {
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/config/committees/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        fetchConfig();
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError(`Failed to delete committee: ${(e as Error).message}`);
    }
  };

  const recruitmentPhaseSuggestions = ['registro', 'entrevistas', 'welcome days'];

  return (
    <Container>
      <Title>Global Configuration</Title>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <StyledLabel htmlFor="currentRecruitment">Current Recruitment ID:</StyledLabel>
        <StyledInput
          id="currentRecruitment"
          type="text"
          value={currentRecruitment}
          onChange={(e) => setCurrentRecruitment(e.target.value)}
        />
      </div>

      <div>
        <StyledLabel htmlFor="recruitmentPhase">Recruitment Phase:</StyledLabel>
        <StyledInput
          id="recruitmentPhase"
          type="text"
          value={recruitmentPhase}
          onChange={(e) => setRecruitmentPhase(e.target.value)}
          list="recruitmentPhaseSuggestions"
        />
        <datalist id="recruitmentPhaseSuggestions">
          {recruitmentPhaseSuggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </div>
      <StyledButton onClick={handleUpdateDetails}>Update Details</StyledButton>

      <Subtitle>Recruiters</Subtitle>
      <div>
        <StyledInput
          type="email"
          placeholder="Add recruiter by email"
          value={newRecruiterEmail}
          onChange={(e) => setNewRecruiterEmail(e.target.value)}
        />
        <StyledButton onClick={handleAddRecruiter}>Add Recruiter</StyledButton>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {recruiters.map((recruiter) => (
          <RecruiterItem key={recruiter._id}>
            <div style={{ marginRight: '10px' }}>
              <Image src={recruiter.image} alt="Profile" width="50" height="50" style={{ borderRadius: "100%" }} />
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ fontWeight: 'bold' }}>{recruiter.name}</div>
              <div>{recruiter.email}</div>
            </div>
            <div>
              <CancelButton onClick={() => handleRemoveRecruiter(recruiter.email)}>Remove</CancelButton>
            </div>
          </RecruiterItem>
        ))}
      </div>

      <Subtitle>Committees</Subtitle>
      <form onSubmit={handleCommitteeSubmit}>
        <StyledInput
          type="text"
          placeholder="Committee Name"
          value={newCommitteeName}
          onChange={(e) => setNewCommitteeName(e.target.value)}
          required
        />
        <HexColorPicker color={newCommitteeColor} onChange={setNewCommitteeColor} />
        <StyledInput
          type="text"
          placeholder="Hex Color"
          value={newCommitteeColor}
          onChange={(e) => setNewCommitteeColor(e.target.value)}
          required
        />
        <StyledButton type="submit">{editingCommittee ? 'Update Committee' : 'Add Committee'}</StyledButton>
        {editingCommittee && <CancelButton type="button" onClick={() => {
          setEditingCommittee(null);
          setNewCommitteeName('');
          setNewCommitteeColor('#aabbcc');
        }}>Cancel Edit</CancelButton>}
      </form>

      <CommitteeList>
        {committees.map((committee) => (
          <CommitteeItem key={committee.name}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ColorBox color={committee.color} />
              {committee.name} ({committee.color})
            </div>
            <div>
              <StyledButton onClick={() => handleEditCommittee(committee)}>Edit</StyledButton>
              <CancelButton onClick={() => handleDeleteCommittee(committee.name)}>Delete</CancelButton>
            </div>
          </CommitteeItem>
        ))}
      </CommitteeList>
    </Container>
  );
};

export default GlobalConfigManager;