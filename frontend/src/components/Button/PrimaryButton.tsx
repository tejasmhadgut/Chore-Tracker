import React from 'react';
import { Loader } from 'lucide-react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
        bg-gradient-to-r from-cyan-500 to-cyan-600
        hover:from-cyan-600 hover:to-cyan-700
        disabled:from-slate-600 disabled:to-slate-700
        disabled:cursor-not-allowed
        text-white font-semibold
        ${sizeClasses[size]}
        rounded-lg
        shadow-lg shadow-cyan-500/30
        hover:shadow-xl hover:shadow-cyan-500/40
        disabled:shadow-none
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
