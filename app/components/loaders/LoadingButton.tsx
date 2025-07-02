import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const StyledButton = styled.button`
  background-color: var(--main-color); /* Primary button color */
  color: white;
  border: none;
  border-radius: var(--border-radius-md); /* Rounded corners for buttons */
  padding: 10px 20px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
  margin-right: 10px;

  &:hover {
    background-color: #0056b3; /* Darker variant of main color */
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  border: 2px solid #f3f3f3; /* Light grey */
  border-top: 2px solid white; /* White spinner */
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: ${spin} 1s linear infinite;
  display: inline-block;
  margin-left: 5px;
`;

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  children: React.ReactNode;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({ isLoading, children, ...props }) => {
  return (
    <StyledButton {...props} disabled={isLoading || props.disabled}>
      {isLoading ? (
        <>
          {children} <Spinner />
        </>
      ) : (
        children
      )}
    </StyledButton>
  );
};

export default LoadingButton;
