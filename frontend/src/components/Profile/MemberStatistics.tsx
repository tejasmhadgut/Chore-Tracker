import React from 'react';
import { MemberStatistics } from '../types/types';

interface MemberStatisticsProps {
  statistics: MemberStatistics | null | undefined;
}

const MemberStatisticsComponent: React.FC<MemberStatisticsProps> = ({ statistics }) => {
  if (!statistics) {
    return <div className="text-slate-400">No statistics available</div>;
  }

  const StatCard = ({
    icon,
    title,
    value,
    unit = '',
    color = 'cyan',
  }: {
    icon: string;
    title: string;
    value: string | number;
    unit?: string;
    color?: string;
  }) => {
    const colorClasses = {
      cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
      green: 'from-green-500/20 to-green-600/20 border-green-500/30',
      blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
      pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
    };

    const textColorClasses = {
      cyan: 'text-cyan-400',
      green: 'text-green-400',
      blue: 'text-blue-400',
      purple: 'text-purple-400',
      orange: 'text-orange-400',
      pink: 'text-pink-400',
    };

    return (
      <div
        className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border rounded-lg p-6`}
      >
        <div className="flex items-start justify-between mb-4">
          <span className="text-2xl">{icon}</span>
        </div>
        <p className="text-slate-400 text-sm mb-2">{title}</p>
        <p
          className={`text-3xl font-bold ${textColorClasses[color as keyof typeof textColorClasses]}`}
        >
          {value}
          {unit && <span className="text-lg ml-1">{unit}</span>}
        </p>
      </div>
    );
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon="✓"
          title="Chores Completed"
          value={statistics?.totalChoresCompleted ?? 0}
          color="green"
        />
        <StatCard
          icon="%"
          title="Completion Rate"
          value={(statistics?.completionRate ?? 0).toFixed(1)}
          unit="%"
          color="cyan"
        />
        <StatCard
          icon="📊"
          title="Average per Week"
          value={(statistics?.averageCompletionsPerWeek ?? 0).toFixed(1)}
          color="blue"
        />
        <StatCard
          icon="🔥"
          title="Current Streak"
          value={statistics?.recentStreak ?? 0}
          unit="days"
          color="orange"
        />
        <StatCard
          icon="👥"
          title="Shared Groups"
          value={statistics?.totalSharedGroups ?? 0}
          color="purple"
        />
        <StatCard
          icon="⭐"
          title="Most Active Group"
          value={statistics?.mostActiveGroup || 'N/A'}
          color="pink"
        />
      </div>
    </div>
  );
};

export default MemberStatisticsComponent;
