import styled, { keyframes } from 'styled-components';

const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
`;

const ThreeDotsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  background-color: var(--main-color);
  border-radius: 50%;
  margin: 0 2px;
  animation: ${bounce} 1.4s infinite ease-in-out both;

  &:nth-child(1) {
    animation-delay: -0.32s;
  }
  &:nth-child(2) {
    animation-delay: -0.16s;
  }
`;

const ThreeDotsLoader = () => {
  return (
    <ThreeDotsContainer>
      <Dot />
      <Dot />
      <Dot />
    </ThreeDotsContainer>
  );
};

export default ThreeDotsLoader;
