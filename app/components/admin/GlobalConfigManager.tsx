'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface Recruiter {
  _id: string;
  email: string;
  name: string;
  image: string;
}

const GlobalConfigManager = () => {
  const [currentRecruitment, setCurrentRecruitment] = useState('');
  const [recruitmentPhase, setRecruitmentPhase] = useState('');
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [newRecruiterEmail, setNewRecruiterEmail] = useState('');
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
    </div>
  );
};

export default GlobalConfigManager;