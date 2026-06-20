import React from 'react';
import { Loader } from 'lucide-react';

interface OutlineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const OutlineButton: React.FC<OutlineButtonProps> = ({
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
        border-2 border-cyan-500 text-cyan-500
        hover:bg-cyan-500/10 hover:border-cyan-400
        disabled:border-slate-600 disabled:text-slate-600 disabled:cursor-not-allowed
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
