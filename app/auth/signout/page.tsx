
'use client'

import { signOut } from "next-auth/react";
import styled from 'styled-components';

const StyledButton = styled.button`
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

export default function SignOut() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Cerrar Sesión</h1>
      <p>Seguro que quieres salir de tu cuenta?</p>
      <br />
      <StyledButton onClick={() => signOut({ callbackUrl: "/" })}>Cerrar sesión</StyledButton>
    </div>
  );
}
