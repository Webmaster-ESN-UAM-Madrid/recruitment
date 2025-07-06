"use client";

import React, { useState, useCallback } from "react";
import { IconButton } from "./IconButton";

// Material Icons paths
const copyIconPath =
  "M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z";

const checkIconPath =
  "M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z";

interface CopyButtonProps {
  content: string;
  iconSize?: number;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  className?: string;
  style?: React.CSSProperties;
  delay?: number; // ms before switching back to copy icon
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  content,
  iconSize = 24,
  color = "default",
  className,
  style,
  delay = 1500,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), delay);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }, [content, delay]);

  return (
    <IconButton
      onClick={handleCopy}
      path={copied ? checkIconPath : copyIconPath}
      color={copied ? "success" : color}
      ariaLabel={copied ? "Copiado" : "Copiar"}
      iconSize={iconSize}
      className={className}
      style={style}
    />
  );
};

export default CopyButton;
