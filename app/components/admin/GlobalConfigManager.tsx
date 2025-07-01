'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
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

const CommitteeList = styled.ul`
  list-style: none;
  padding: 0;
`;

const CommitteeItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ccc;

  &:last-child {
    border-bottom: none;
  }
`;

const ColorBox = styled.div<{ color: string }>`
  width: 20px;
  height: 20px;
  background-color: ${(props) => props.color};
  border: 1px solid #ccc;
  margin-right: 10px;
`;

const Button = styled.button`
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #007bff;
  color: white;

  &:hover {
    background-color: #0056b3;
  }

  & + & {
    margin-left: 10px;
  }
`;

const GlobalConfigManager = () => { // Added comment to force re-render
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
    <div>
      <h2>Global Configuration</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <label htmlFor="currentRecruitment">Current Recruitment ID:</label>
        <input
          id="currentRecruitment"
          type="text"
          value={currentRecruitment}
          onChange={(e) => setCurrentRecruitment(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="recruitmentPhase">Recruitment Phase:</label>
        <input
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
      <button onClick={handleUpdateDetails}>Update Details</button>

      <h3>Recruiters</h3>
      <div>
        <input
          type="email"
          placeholder="Add recruiter by email"
          value={newRecruiterEmail}
          onChange={(e) => setNewRecruiterEmail(e.target.value)}
        />
        <button onClick={handleAddRecruiter}>Add Recruiter</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {recruiters.map((recruiter) => (
          <div key={recruiter._id} style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
            <div style={{ marginRight: '10px' }}>
              <Image src={recruiter.image} alt="Profile" width="50" height="50" style={{ borderRadius: "100%" }} />
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ fontWeight: 'bold' }}>{recruiter.name}</div>
              <div>{recruiter.email}</div>
            </div>
            <div>
              <button onClick={() => handleRemoveRecruiter(recruiter.email)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <h3>Committees</h3>
      <form onSubmit={handleCommitteeSubmit}>
        <input
          type="text"
          placeholder="Committee Name"
          value={newCommitteeName}
          onChange={(e) => setNewCommitteeName(e.target.value)}
          required
        />
        <HexColorPicker color={newCommitteeColor} onChange={setNewCommitteeColor} />
        <input
          type="text"
          placeholder="Hex Color"
          value={newCommitteeColor}
          onChange={(e) => setNewCommitteeColor(e.target.value)}
          required
        />
        <Button type="submit">{editingCommittee ? 'Update Committee' : 'Add Committee'}</Button>
        {editingCommittee && <Button type="button" onClick={() => {
          setEditingCommittee(null);
          setNewCommitteeName('');
          setNewCommitteeColor('#aabbcc');
        }}>Cancel Edit</Button>}
      </form>

      <CommitteeList>
        {committees.map((committee) => (
          <CommitteeItem key={committee.name}>
            <div>
              <ColorBox color={committee.color} />
              {committee.name} ({committee.color})
            </div>
            <div>
              <Button onClick={() => handleEditCommittee(committee)}>Edit</Button>
              <Button onClick={() => handleDeleteCommittee(committee.name)}>Delete</Button>
            </div>
          </CommitteeItem>
        ))}
      </CommitteeList>
    </div>
  );
};

export default GlobalConfigManager;