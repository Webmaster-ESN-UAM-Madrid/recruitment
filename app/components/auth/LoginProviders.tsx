/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import { getProviders, signIn } from "next-auth/react";
import React from "react";
import LoadingSpinner from "../loaders/LoadingSpinner";
import styled from 'styled-components';

const StyledLoginButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  &:hover {
    background-color: #0056b3;
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

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
    <div>
      {Object.values(providers).map((provider: any) => (
        <div key={provider.name}>
          <StyledLoginButton disabled={isLoading} onClick={() => signIn(provider.id, { callbackUrl: "/" })}>
            {isLoading ? 'Loading...' : `Iniciar sesión con ${provider.name}`}
          </StyledLoginButton>
        </div>
      ))}
    </div>
  );
}