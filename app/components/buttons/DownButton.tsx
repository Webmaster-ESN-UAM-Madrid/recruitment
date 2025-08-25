import React from "react";
import { IconButton } from "./IconButton";

interface DownButtonProps {
    onClick: () => Promise<void> | void;
    ariaLabel?: string;
    disabled?: boolean;
    isLoading?: boolean;
    showSpinner?: boolean;
    className?: string;
    iconSize?: number;
    style?: React.CSSProperties;
}

export const DownButton: React.FC<DownButtonProps> = ({ onClick, ariaLabel = "Abajo", disabled = false, isLoading = false, showSpinner = false, className, iconSize = 24, style }) => {
    return <IconButton onClick={onClick} path="M480-80 200-360l56-56 184 183v-647h80v647l184-184 56 57L480-80Z" color="primary" ariaLabel={ariaLabel} disabled={disabled} isLoading={isLoading} showSpinner={showSpinner} className={className} iconSize={iconSize} style={style} />;
};
