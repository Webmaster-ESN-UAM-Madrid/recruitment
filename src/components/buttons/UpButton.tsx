import React from "react";
import { IconButton } from "./IconButton";

interface UpButtonProps {
  onClick: () => Promise<void> | void;
  ariaLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  showSpinner?: boolean;
  className?: string;
  iconSize?: number;
  style?: React.CSSProperties;
}

export const UpButton: React.FC<UpButtonProps> = ({
  onClick,
  ariaLabel = "Arriba",
  disabled = false,
  isLoading = false,
  showSpinner = false,
  className,
  iconSize = 24,
  style
}) => {
  return (
    <IconButton
      onClick={onClick}
      path="M440-80v-647L256-544l-56-56 280-280 280 280-56 57-184-184v647h-80Z"
      color="primary"
      ariaLabel={ariaLabel}
      disabled={disabled}
      isLoading={isLoading}
      showSpinner={showSpinner}
      className={className}
      iconSize={iconSize}
      style={style}
    />
  );
};
