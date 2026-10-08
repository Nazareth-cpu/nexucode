import React from 'react';

interface NexusCodeLogoProps {
  variant?: 'full' | 'compact' | 'sidebar' | 'horizontal';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
}

export function NexusCodeLogo({
  variant = 'full',
  className = '',
  size = 'md',
  showGlow = true,
}: NexusCodeLogoProps) {
  const sizeMap = {
    sm: { icon: 28, text: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 36, text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 48, text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 64, text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  // Vector geometric 3D Interlocking 'N' with glowing code brackets in Purple + Amber
  const iconSvg = (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${showGlow ? 'group' : ''}`}>
      {/* Background glow halo */}
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.5) 0%, rgba(245, 158, 11, 0.4) 60%, transparent 80%)',
          }}
        />
      )}

      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Purple Gradients */}
          <linearGradient id="purpleLeftRibbon" x1="20" y1="20" x2="45" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#581C87" />
          </linearGradient>

          <linearGradient id="purpleRightRibbon" x1="55" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>

          {/* Amber Center Diagonal */}
          <linearGradient id="amberDiagonal" x1="30" y1="20" x2="70" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="40%" stopColor="#FBBF24" />
            <stop offset="80%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Bracket gradients */}
          <linearGradient id="bracketLeftGrad" x1="5" y1="30" x2="25" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="bracketRightGrad" x1="75" y1="30" x2="95" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Outer Circular Orbit Ring (Subtle) */}
        <circle cx="50" cy="50" r="44" stroke="#7C3AED" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />
        <circle cx="50" cy="6" r="1.5" fill="#FBBF24" />
        <circle cx="50" cy="94" r="1.5" fill="#A855F7" />
        <circle cx="6" cy="50" r="1.5" fill="#A855F7" />
        <circle cx="94" cy="50" r="1.5" fill="#FBBF24" />

        {/* Left Glowing Code Bracket { */}
        <path
          d="M 22 34 C 18 34, 15 37, 15 42 L 15 46 C 15 49, 12 50, 10 50 C 12 50, 15 51, 15 54 L 15 58 C 15 63, 18 66, 22 66"
          stroke="url(#bracketLeftGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />

        {/* Right Glowing Code Bracket } */}
        <path
          d="M 78 34 C 82 34, 85 37, 85 42 L 85 46 C 85 49, 88 50, 90 50 C 88 50, 85 51, 85 54 L 85 58 C 85 63, 82 66, 78 66"
          stroke="url(#bracketRightGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />

        {/* Left Vertical 3D Bar of 'N' */}
        <path
          d="M 28 26 L 41 18 L 41 68 L 28 76 Z"
          fill="url(#purpleLeftRibbon)"
        />
        {/* Left 3D facet highlight */}
        <path
          d="M 28 26 L 33 23 L 33 73 L 28 76 Z"
          fill="#C084FC"
          opacity="0.4"
        />

        {/* Right Vertical 3D Bar of 'N' */}
        <path
          d="M 59 32 L 72 24 L 72 74 L 59 82 Z"
          fill="url(#purpleRightRibbon)"
        />
        {/* Right 3D facet highlight */}
        <path
          d="M 67 27 L 72 24 L 72 74 L 67 77 Z"
          fill="#FDE047"
          opacity="0.3"
        />

        {/* Interlocking Amber Diagonal Bar */}
        <path
          d="M 37 20 L 46 16 L 72 68 L 63 74 Z"
          fill="url(#amberDiagonal)"
          filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
        />
        {/* Amber Diagonal Top/Edge Highlight */}
        <path
          d="M 37 20 L 46 16 L 49 20 L 40 24 Z"
          fill="#FFFBEB"
          opacity="0.7"
        />
        <path
          d="M 40 24 L 66 72 L 63 74 L 37 26 Z"
          fill="#FBBF24"
          opacity="0.4"
        />
      </svg>
    </div>
  );

  if (variant === 'compact') {
    return <div className={`inline-flex items-center ${className}`}>{iconSvg}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {iconSvg}
      <div className="flex flex-col">
        <div className="flex items-center tracking-tight">
          <span className="font-extrabold text-[#F8FAFC] tracking-wider uppercase font-sans text-base sm:text-lg">
            NEX
          </span>
          <span className="font-extrabold bg-gradient-to-r from-[#A855F7] via-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent tracking-wider uppercase font-sans text-base sm:text-lg">
            US
          </span>
        </div>
        <div className="flex items-center gap-1 -mt-1">
          <span className="h-[1px] w-2 bg-[#F59E0B]/60" />
          <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-[#F59E0B] uppercase">
            CODE
          </span>
          <span className="h-[1px] w-2 bg-[#F59E0B]/60" />
        </div>
      </div>
    </div>
  );
}
