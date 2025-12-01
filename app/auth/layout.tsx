"use client";

import styled from "styled-components";

const AuthContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg-secondary);
  padding: 20px;
`;

const AuthCard = styled.div`
  background: var(--bg-primary);
  padding: 40px;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthContainer>
      <AuthCard>{children}</AuthCard>
    </AuthContainer>
  );
}
