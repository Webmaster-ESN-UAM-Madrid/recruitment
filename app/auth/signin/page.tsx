"use client";

import { useSearchParams } from "next/navigation";
import LoginProviders from "../../../src/components/auth/LoginProviders";
import React, { Suspense } from "react";
import LoadingSpinner from "../../../src/components/loaders/LoadingSpinner";
import styled from "styled-components";

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  margin-bottom: 2rem;
  font-size: 1rem;
`;

const ErrorMessage = styled.div`
  background-color: #FEE2E2;
  color: #DC2626;
  padding: 12px;
  border-radius: var(--border-radius-sm);
  margin-bottom: 20px;
  font-size: 0.9rem;
  border: 1px solid #FECACA;
`;

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  const errors: Record<string, string> = {
    Configuration: "Hay un problema con la configuración del servidor.",
    AccessDenied: "No tienes permiso para iniciar sesión.",
    Verification: "El token ha expirado o ya ha sido utilizado.",
    Default: "No se pudo iniciar sesión."
  };

  const errorMessage = error && (errors[error] || errors.Default);

  return (
    <>
      <Title>Bienvenido</Title>
      <Subtitle>Inicia sesión para acceder al portal de reclutamiento</Subtitle>
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      <LoginProviders />
    </>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SignInContent />
    </Suspense>
  );
}
