import React from "react";
import { IconButton } from "./IconButton";

interface DeleteButtonProps {
  onClick: () => Promise<void> | void;
  ariaLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  showSpinner?: boolean;
  className?: string;
  iconSize?: number;
  style?: React.CSSProperties;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  onClick,
  ariaLabel = "Eliminar",
  disabled = false,
  isLoading = false,
  showSpinner = true,
  className,
  iconSize = 24,
  style,
}) => {
  return (
    <IconButton
      onClick={onClick}
      path="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
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
