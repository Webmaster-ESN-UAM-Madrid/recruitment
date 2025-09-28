import React from "react";
import { IconButton } from "./IconButton";

interface CancelButtonProps {
  onClick: () => Promise<void> | void;
  ariaLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  showSpinner?: boolean;
  className?: string;
  iconSize?: number;
  style?: React.CSSProperties;
}

export const CancelButton: React.FC<CancelButtonProps> = ({
  onClick,
  ariaLabel = "Cancelar",
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
      path="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
      color="danger"
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
