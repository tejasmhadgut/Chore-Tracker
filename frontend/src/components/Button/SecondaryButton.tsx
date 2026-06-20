import React from 'react';
import { Loader } from 'lucide-react';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
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
        bg-slate-700 hover:bg-slate-600
        disabled:bg-slate-600 disabled:cursor-not-allowed
        text-slate-100 font-semibold
        ${sizeClasses[size]}
        rounded-lg
        shadow-lg
        hover:shadow-xl
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
