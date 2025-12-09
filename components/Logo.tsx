import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="2" y1="28" x2="30" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" /> {/* Blue-500 */}
          <stop offset="1" stopColor="#10b981" /> {/* Emerald-500 */}
        </linearGradient>
        <filter id="glow" x="-4" y="-4" width="40" height="40" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Background shape (subtle) */}
      <path 
        d="M6 10C6 7.79086 7.79086 6 10 6H22C24.2091 6 26 7.79086 26 10V22C26 24.2091 24.2091 26 22 26H10C7.79086 26 6 24.2091 6 22V10Z" 
        fill="url(#logoGradient)" 
        fillOpacity="0.1" 
        stroke="url(#logoGradient)" 
        strokeOpacity="0.3"
      />

      {/* Main Graph/Circuit Line */}
      <path
        d="M9 22L14 16L17 19L23.5 10.5"
        stroke="url(#logoGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Circuit Dots */}
      <circle cx="9" cy="22" r="1.5" fill="#3b82f6" />
      <circle cx="14" cy="16" r="1.5" fill="#3b82f6" />
      <circle cx="17" cy="19" r="1.5" fill="#10b981" />
      
      {/* Arrow Head / Spark */}
      <path
        d="M20.5 10.5H23.5V13.5"
        stroke="url(#logoGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
