"use client"; // Error components must be Client Components

import { useEffect } from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  text-align: center;
  background-color: var(--bg-secondary);
`;

const ErrorCard = styled.div`
  background: var(--bg-primary);
  padding: 40px;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  width: 100%;
  border: 1px solid var(--border-primary);
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const RetryButton = styled.button`
  background-color: var(--button-primary-bg);
  color: var(--button-primary-text);
  padding: 12px 24px;
  border: none;
  border-radius: var(--border-radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--button-primary-hover-bg);
  }
`;

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <Container>
      <ErrorCard>
        <Title>¡Vaya! Algo salió mal</Title>
        <Message>
          Ha ocurrido un error inesperado. Por favor, intenta recargar la página o contacta con soporte si el problema persiste.
        </Message>
        <RetryButton
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          Intentar de nuevo
        </RetryButton>
      </ErrorCard>
    </Container>
  );
}
