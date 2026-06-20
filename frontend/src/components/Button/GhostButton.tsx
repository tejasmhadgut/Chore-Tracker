import React from 'react';
import { Loader } from 'lucide-react';

interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const GhostButton: React.FC<GhostButtonProps> = ({
  children,
  isLoading,
  icon,
  fullWidth = false,
  size = 'md',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`
        bg-transparent text-slate-300
        hover:bg-slate-700/50 hover:text-slate-100
        disabled:text-slate-600 disabled:cursor-not-allowed
        font-semibold
        ${sizeClasses[size]}
        rounded-lg
        active:scale-95
        transition-all duration-200
        flex items-center justify-center gap-2
        ${fullWidth ? 'w-full' : ''}
      `}
    >
      {isLoading ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};
