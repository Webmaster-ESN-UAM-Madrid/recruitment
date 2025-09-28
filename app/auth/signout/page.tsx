"use client";

import { signOut } from "next-auth/react";
import styled from "styled-components";

const StyledButton = styled.button`
  background-color: var(--button-primary-bg);
  color: var(--button-primary-text);
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  &:hover {
    background-color: var(--button-primary-hover-bg);
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

export default function SignOut() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Cerrar Sesión</h1>
      <p>Seguro que quieres salir de tu cuenta?</p>
      <br />
      <StyledButton onClick={() => signOut({ callbackUrl: "/" })}>Cerrar sesión</StyledButton>
    </div>
  );
}
