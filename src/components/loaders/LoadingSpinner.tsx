import styled, { keyframes } from "styled-components";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%; /* Occupy full height of parent */
  min-height: max-content; /* Ensure it occupies at least the height of its content */
  width: 100%; /* Occupy full width of parent */
  padding: 10px; /* Add some padding */
`;

const Spinner = styled.div<{ size: number; color?: string }>`
  border: 4px solid #f3f3f3; /* Light grey */
  border-top: 4px solid ${(props) => props.color || "var(--brand-primary)"};
  border-radius: 50%;
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
  animation: ${spin} 1s linear infinite;
`;

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  color,
  className
}) => {
  return (
    <SpinnerContainer className={className}>
      <Spinner size={size} color={color} />
    </SpinnerContainer>
  );
};

export default LoadingSpinner;
