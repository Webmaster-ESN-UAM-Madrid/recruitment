
'use client';

import React from 'react';
import styled from 'styled-components';
import { useTheme } from './contexts/ThemeContext';
import Link from 'next/link';

const AppContainer = styled.div`
  text-align: center;
  padding: 20px;
`;

const Navbar = styled.nav`
  background-color: ${props => props.theme.colors.primary};
  padding: 10px;
  ul {
    list-style: none;
    padding: 0;
    display: flex;
    justify-content: center;
  }
  li {
    margin: 0 15px;
  }
  a {
    color: white;
    text-decoration: none;
    font-weight: bold;
  }
`;

const ThemeControls = styled.div`
  margin-bottom: 20px;
`;

const ThemeToggleButton = styled.button<{ primaryColor: string }>`
  background-color: ${props => props.primaryColor};
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin: 10px;
`;

const ColorInput = styled.input`
  margin: 10px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
`;

export default function App() {
  const { theme, toggleTheme, colors, setPrimaryColor, setSecondaryColor } = useTheme();

  return (
    <>
      <Navbar>
        <ul>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/feedback">Feedback</Link></li>
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/incidents">Incidents</Link></li>
          <li><Link href="/profile">Profile</Link></li>
          <li><Link href="/admin">Admin Panel</Link></li>
        </ul>
      </Navbar>

      <AppContainer>
        <ThemeControls>
          <p>Current theme: {theme}</p>
          <ThemeToggleButton primaryColor={colors.primary} onClick={toggleTheme}>Toggle Theme</ThemeToggleButton>

          <div>
            <h3>Customize Colors:</h3>
            <label>Primary Color:
              <ColorInput
                type="color"
                value={colors.primary}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
            </label>
            <label>Secondary Color:
              <ColorInput
                type="color"
                value={colors.secondary}
                onChange={(e) => setSecondaryColor(e.target.value)}
              />
            </label>
          </div>
        </ThemeControls>

        {/* The content of the current page will be rendered by Next.js */}
      </AppContainer>
    </>
  );
}
