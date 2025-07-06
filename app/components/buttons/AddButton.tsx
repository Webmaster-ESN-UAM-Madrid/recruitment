import React from "react";
import { IconButton } from "./IconButton";

interface AddButtonProps {
  onClick: () => Promise<void> | void;
  ariaLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  showSpinner?: boolean;
  className?: string;
  iconSize?: number;
  style?: React.CSSProperties;
}

export const AddButton: React.FC<AddButtonProps> = ({
  onClick,
  ariaLabel = "Nuevo",
  disabled = false,
  isLoading = false,
  showSpinner = false,
  className,
  iconSize = 24,
  style,
}) => {
  return (
    <IconButton
      onClick={onClick}
      path="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"
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
