"use client";

import React, { useState, ReactNode, createContext, useContext } from "react";
import { Button } from "@nextui-org/react";
import styled, { keyframes } from "styled-components";

// Define a styled component for the button to apply custom styles
const StyledButton = styled(Button)<{ iconSize: number }>`
  background-color: rgba(0, 0, 0, 0.035);
  width: ${({ iconSize }) => iconSize * 2}px;
  height: ${({ iconSize }) => iconSize * 2}px;
  min-width: ${({ iconSize }) => iconSize * 2}px;
  min-height: ${({ iconSize }) => iconSize * 2}px;
  padding: 0;
  border: none;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  transition: background-color 0.2s ease-in-out, border-radius 0.2s ease-in-out;

  &:not(:disabled):hover {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
  }

  .nextui-ripple {
    display: none !important;
  }

  & .nextui-button-icon {
    color: currentColor;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const getColor = (color: string) => {
  switch (color) {
    case "primary":
      return "var(--button-primary-bg)";
    case "secondary":
      return "var(--button-secondary-bg)";
    case "success":
      return "var(--button-success-bg)";
    case "warning":
      return "var(--button-warning-bg)";
    case "danger":
      return "var(--button-danger-bg)";
    default:
      return "var(--button-default-bg)";
  }
}

const CustomSpinner = styled.div<{ size: number; color: string }>`
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-left-color: ${({ color }) => getColor(color)};
  border-radius: 50%;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  animation: ${spin} 1s linear infinite;
`;

interface IconButtonProps {
  onClick: () => Promise<void> | void;
  path: string; // Changed from icon: ReactNode
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  ariaLabel: string;
  disabled?: boolean;
  isLoading?: boolean;
  showSpinner?: boolean;
  className?: string;
  iconSize?: number; // New prop for icon size
  style?: React.CSSProperties; // New prop for custom styles
}

interface ButtonContextType {
  disableAll: boolean;
  setDisableAll: (disable: boolean) => void;
}

const ButtonContext = createContext<ButtonContextType | undefined>(undefined);

export const ButtonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [disableAll, setDisableAll] = useState(false);
  return (
    <ButtonContext.Provider value={{ disableAll, setDisableAll }}>
      {children}
    </ButtonContext.Provider>
  );
};

export const useButtonContext = () => {
  const context = useContext(ButtonContext);
  if (!context) {
    throw new Error("useButtonContext must be used within a ButtonProvider");
  }
  return context;
};

export const IconButton: React.FC<IconButtonProps> = ({
  onClick,
  path, // Changed from icon
  color = "default",
  ariaLabel,
  disabled = false,
  isLoading = false,
  showSpinner = false,
  className,
  iconSize = 24, // Default icon size
  style, // New prop for custom styles
}) => {
  const [loading, setLoading] = useState(isLoading);
  const { disableAll, setDisableAll } = useButtonContext();

  const handleClick = async () => {
    if (showSpinner) {
      setLoading(true);
    }
    setDisableAll(true);
    try {
      await onClick();
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
      setDisableAll(false);
    }
  };

  const iconColor = disabled ? "var(--button-disabled-bg)" : getColor(color);

  return (
    <StyledButton
      isIconOnly
      color={color}
      aria-label={ariaLabel}
      isDisabled={disabled || loading || disableAll}
      onClick={handleClick}
      className={className}
      disableRipple
      iconSize={iconSize}
      style={style}
    >
      {loading && showSpinner ? (
        <CustomSpinner size={iconSize} color={color} />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={`${iconSize}px`}
          viewBox="0 -960 960 960"
          width={`${iconSize}px`}
          fill={iconColor}
        >
          <path d={path} />
        </svg>
      )}
    </StyledButton>
  );
};
