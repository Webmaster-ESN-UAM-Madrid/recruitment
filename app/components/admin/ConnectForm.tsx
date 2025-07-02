'use client';
import GoogleFormsConnect from './GoogleFormsConnect';
import styled from 'styled-components';

const Container = styled.div`
  background-color: #ffffff;
  border-radius: var(--border-radius-md);
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
`;

const ConnectForm = () => {
  return (
    <Container>
      <GoogleFormsConnect />
    </Container>
  );
};

export default ConnectForm;