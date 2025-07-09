import React from "react";
import { IconButton } from "./IconButton";

interface AcceptButtonProps {
  onClick: () => Promise<void> | void;
  ariaLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  showSpinner?: boolean;
  className?: string;
  iconSize?: number;
  style?: React.CSSProperties;
}

export const AcceptButton: React.FC<AcceptButtonProps> = ({
  onClick,
  ariaLabel = "Aceptar",
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
      path="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"
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
