/**
 * CodingClubLogo
 *
 * Official Coding Club – GMRIT Deemed to be University logo.
 * Source image: /public/coding_club_logo.png
 *   (Neon Coding Club Mascot Emblem – provided by the Coding Club)
 *
 * Props:
 *  - size     : pixel width (height scales automatically). Default 120.
 *  - className: optional CSS class string.
 *  - style    : optional inline style overrides.
 */

import React from "react";

interface CodingClubLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function CodingClubLogo({
  size = 120,
  className,
  style,
}: CodingClubLogoProps) {
  return (
    <img
      src="/coding_club_logo.png"
      alt="Coding Club – GMRIT Deemed to be University"
      width={size}
      className={className}
      style={{ display: "block", objectFit: "contain", ...style }}
      draggable={false}
    />
  );
}
