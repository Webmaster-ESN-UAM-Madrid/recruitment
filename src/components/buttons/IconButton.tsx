"use client";

import React, {
  useState,
  ReactNode,
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback
} from "react";
import { Button } from "@nextui-org/react";
import styled, { keyframes } from "styled-components";
import Tooltip from "@mui/material/Tooltip";

// Define a styled component for the button to apply custom styles
const StyledButton = styled(Button)<{
  iconSize: number;
  $holdProgress: number;
  $buttonColor: string;
}>`
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
  transition:
    background-color 0.2s ease-in-out,
    border-radius 0.2s ease-in-out;

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

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: ${({ $holdProgress }) => $holdProgress}%;
    height: 100%;
    background-color: color-mix(in srgb, ${({ $buttonColor }) => $buttonColor}, transparent 75%);
    transition: width 0.1s linear;
    z-index: 1;
  }

  & > svg {
    position: relative;
    z-index: 2;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const getColor = (color: string, isDisabled: boolean) => {
  let baseColor;
  switch (color) {
    case "primary":
      baseColor = "var(--button-primary-bg)";
      break;
    case "secondary":
      baseColor = "var(--button-secondary-bg)";
      break;
    case "success":
      baseColor = "var(--button-success-bg)";
      break;
    case "warning":
      baseColor = "var(--button-warning-bg)";
      break;
    case "danger":
      baseColor = "var(--button-danger-bg)";
      break;
    default:
      baseColor = "var(--button-default-bg)";
  }
  return isDisabled ? `color-mix(in srgb, ${baseColor}, transparent 50%)` : baseColor;
};

const CustomSpinner = styled.div<{ size: number; color: string }>`
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-left-color: ${({ color }) => getColor(color, false)};
  border-radius: 50%;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  animation: ${spin} 1s linear infinite;
  position: relative;
  z-index: 2;
`;

interface IconButtonProps {
  onClick: () => Promise<void> | void;
  path: string;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  ariaLabel: string;
  disabled?: boolean;
  isLoading?: boolean;
  showSpinner?: boolean;
  needsConfirmation?: boolean;
  confirmationDuration?: number;
  className?: string;
  iconSize?: number;
  style?: React.CSSProperties;
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
  path,
  color = "default",
  ariaLabel,
  disabled = false,
  isLoading = false,
  showSpinner = false,
  needsConfirmation = false,
  confirmationDuration = 750,
  className,
  iconSize = 24,
  style
}) => {
  const [loading, setLoading] = useState(isLoading);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { disableAll, setDisableAll } = useButtonContext();

  const endHold = useCallback(() => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const executeClick = useCallback(async () => {
    endHold();
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
  }, [endHold, onClick, showSpinner, setDisableAll]);

  const startHold = useCallback(() => {
    if (disabled || loading || disableAll || !needsConfirmation) return;

    setIsHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min((elapsedTime / confirmationDuration) * 100, 100);
      setHoldProgress(progress);

      if (progress === 100) {
        clearInterval(progressIntervalRef.current!);
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        executeClick();
      }
    }, 50);

    holdTimerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (isHolding) {
        executeClick();
      }
    }, confirmationDuration);
  }, [
    disabled,
    loading,
    disableAll,
    needsConfirmation,
    confirmationDuration,
    isHolding,
    executeClick
  ]);

  const handlePress = () => {
    if (!needsConfirmation) {
      executeClick();
    } else {
      setShowTooltip(true);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(false);
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  const isActuallyDisabled = disabled || loading || disableAll;
  const buttonColor = getColor(color, isActuallyDisabled);

  return (
    <Tooltip title="Mantén presionado para confirmar" open={showTooltip} placement="top" arrow>
      <StyledButton
        isIconOnly
        color={color}
        aria-label={ariaLabel}
        isDisabled={isActuallyDisabled}
        onPressStart={startHold}
        onPressEnd={endHold}
        onPress={handlePress}
        className={className}
        disableRipple
        iconSize={iconSize}
        style={style}
        $holdProgress={holdProgress}
        $buttonColor={buttonColor}
      >
        {loading && showSpinner ? (
          <CustomSpinner size={iconSize} color={color} />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height={`${iconSize}px`}
            viewBox="0 -960 960 960"
            width={`${iconSize}px`}
            fill={disabled ? "var(--button-disabled-bg)" : buttonColor}
          >
            <path d={path} />
          </svg>
        )}
      </StyledButton>
    </Tooltip>
  );
};
