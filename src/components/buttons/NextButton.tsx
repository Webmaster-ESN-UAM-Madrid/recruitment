import React from "react";
import { IconButton } from "./IconButton";

interface NextButtonProps {
  onClick: () => Promise<void> | void;
  ariaLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  showSpinner?: boolean;
  className?: string;
  iconSize?: number;
  style?: React.CSSProperties;
}

export const NextButton: React.FC<NextButtonProps> = ({
  onClick,
  ariaLabel = "Siguiente",
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
      path="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"
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
