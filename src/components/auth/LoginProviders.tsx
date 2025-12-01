/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { getProviders, signIn } from "next-auth/react";
import React from "react";
import LoadingSpinner from "../loaders/LoadingSpinner";
import styled from "styled-components";
import { FcGoogle } from "react-icons/fc"; // Assuming react-icons is installed, if not I will need to check package.json or use text
import { FaDiscord, FaGithub } from "react-icons/fa";

const ProvidersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const StyledLoginButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding: 12px 20px;
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);

  &:hover {
    background-color: var(--bg-secondary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

// Helper to get icon based on provider name
const getProviderIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("google")) return <FcGoogle size={20} />;
  if (lowerName.includes("discord")) return <FaDiscord size={20} color="#5865F2" />;
  if (lowerName.includes("github")) return <FaGithub size={20} />;
  return null;
};

export default function LoginProviders() {
  const [providers, setProviders] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true);
      const res = await getProviders();
      setProviders(res);
      setIsLoading(false);
    };
    fetchProviders();
  }, []);

  if (!providers) {
    return <LoadingSpinner />;
  }

  return (
    <ProvidersContainer>
      {Object.values(providers).map((provider: any) => (
        <StyledLoginButton
          key={provider.name}
          disabled={isLoading}
          onClick={() => signIn(provider.id, { callbackUrl: "/" })}
        >
          {getProviderIcon(provider.name)}
          <span>{isLoading ? <LoadingSpinner size={20} /> : `Continuar con ${provider.name}`}</span>
        </StyledLoginButton>
      ))}
    </ProvidersContainer>
  );
}
