import React from "react";
import { IconButton } from "./IconButton";

interface ResetButtonProps {
    onClick: () => Promise<void> | void;
    ariaLabel?: string;
    disabled?: boolean;
    isLoading?: boolean;
    showSpinner?: boolean;
    className?: string;
    iconSize?: number;
    style?: React.CSSProperties;
}

export const ResetButton: React.FC<ResetButtonProps> = ({ onClick, ariaLabel = "Reset", disabled = false, isLoading = false, showSpinner = false, className, iconSize = 24, style }) => {
    return <IconButton onClick={onClick} path="M160-440v-80h640v80H160Z" color="default" ariaLabel={ariaLabel} disabled={disabled} isLoading={isLoading} showSpinner={showSpinner} className={className} iconSize={iconSize} style={style} />;
};
