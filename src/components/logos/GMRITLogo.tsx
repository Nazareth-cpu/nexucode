/**
 * GMRITLogo
 *
 * Official GMRIT – Deemed to be University logo.
 * Source image: /public/gmrit_logo.png
 *   (gmr logo.jpg – provided by GMRIT University)
 *
 * Props:
 *  - size     : pixel width (height scales automatically). Default 120.
 *  - className: optional CSS class string.
 *  - style    : optional inline style overrides.
 */

import React from "react";

interface GMRITLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function GMRITLogo({
  size = 120,
  className,
  style,
}: GMRITLogoProps) {
  return (
    <img
      src="/gmrit_logo.png"
      alt="GMRIT – Deemed to be University"
      width={size}
      className={className}
      style={{ display: "block", objectFit: "contain", ...style }}
      draggable={false}
    />
  );
}
