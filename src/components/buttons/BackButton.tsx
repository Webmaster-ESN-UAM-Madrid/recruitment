import React from "react";
import { IconButton } from "./IconButton";

interface BackButtonProps {
  onClick: () => Promise<void> | void;
  ariaLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  showSpinner?: boolean;
  className?: string;
  iconSize?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  ariaLabel = "Atrás",
  disabled = false,
  isLoading = false,
  showSpinner = false,
  className,
  iconSize = 24,
  style,
  children
}) => {
  return (
    <IconButton
      onClick={onClick}
      path="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z"
      color="default"
      ariaLabel={ariaLabel}
      disabled={disabled}
      isLoading={isLoading}
      showSpinner={showSpinner}
      className={className}
      iconSize={iconSize}
      style={style}
    >
      {children}
    </IconButton>
  );
};
