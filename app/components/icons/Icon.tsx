import React from "react";

interface IconProps {
  path: string;
  size?: number;
  color?: string;
  viewBox?: string;
}

export const Icon: React.FC<IconProps> = ({
  path,
  size = 24,
  color = "currentColor",
  viewBox = "0 -960 960 960",
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={size}
      viewBox={viewBox}
      width={size}
      fill={color}
    >
      <path d={path} />
    </svg>
  );
};
