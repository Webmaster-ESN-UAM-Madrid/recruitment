'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    // Add more colors as needed
  };
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    return localStorage.getItem('primaryColor') || '#007bff'; // Default primary color
  });

  const [secondaryColor, setSecondaryColor] = useState<string>(() => {
    return localStorage.getItem('secondaryColor') || '#6c757d'; // Default secondary color
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('primaryColor', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    localStorage.setItem('secondaryColor', secondaryColor);
  }, [secondaryColor]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const lightColors = {
    primary: primaryColor,
    secondary: secondaryColor,
    background: '#ffffff',
    text: '#333333',
  };

  const darkColors = {
    primary: primaryColor,
    secondary: secondaryColor,
    background: '#333333',
    text: '#ffffff',
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors, setPrimaryColor, setSecondaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};