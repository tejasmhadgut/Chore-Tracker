import React from 'react';

interface LogoProps {
  size?: number;
  variant?: 'full' | 'icon'; // 'full' = logo + text, 'icon' = just the mark
  className?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ size = 40, variant = 'full', className = '', onClick }) => {
  return (
    <div className={`flex items-center gap-2 ${className} ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      {/* Logo Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Background circle */}
        <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" className="text-cyan-500" />

        {/* Checkmark */}
        <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="text-cyan-400">
          <path d="M18 32L28 42L46 22" stroke="currentColor" fill="none" />
        </g>

        {/* Accent dots */}
        <circle cx="38" cy="18" r="2.5" fill="currentColor" className="text-cyan-400" />
        <circle cx="48" cy="48" r="2.5" fill="currentColor" className="text-cyan-500" />
      </svg>

      {/* Logo Text */}
      {variant === 'full' && (
        <span className="font-bold text-white text-lg tracking-wide hidden sm:inline">
          ChoreTrack
        </span>
      )}
    </div>
  );
};

export default Logo;
