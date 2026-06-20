import React from 'react';
import { LucideIcon } from 'lucide-react';
import { PrimaryButton } from '../Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6 p-4 bg-slate-700/50 rounded-full">
        <Icon className="w-12 h-12 text-cyan-400" />
      </div>

      <h3 className="text-2xl font-bold text-slate-100 mb-2">
        {title}
      </h3>

      <p className="text-slate-400 mb-8 max-w-sm">
        {description}
      </p>

      {actionLabel && onAction && (
        <PrimaryButton onClick={onAction}>
          {actionLabel}
        </PrimaryButton>
      )}
    </div>
  );
};
