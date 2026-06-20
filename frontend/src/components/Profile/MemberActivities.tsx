import React from 'react';
import { Activity } from '../types/types';

interface MemberActivitiesProps {
  activities: Activity[];
}

const MemberActivities: React.FC<MemberActivitiesProps> = ({ activities }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completion':
        return '✓';
      case 'member_joined':
        return '+';
      case 'chore_created':
        return '✎';
      default:
        return '•';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'completion':
        return 'text-green-400';
      case 'member_joined':
        return 'text-blue-400';
      case 'chore_created':
        return 'text-yellow-400';
      default:
        return 'text-cyan-400';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">No recent activity</p>
        <p className="text-slate-500 text-sm">
          This member hasn't completed any chores yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div
          key={index}
          className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition-colors"
        >
          <div className="flex items-start gap-3">
            {/* Activity Icon */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full bg-slate-600/50 flex items-center justify-center ${getActivityColor(
                activity.type
              )} font-bold text-sm`}
            >
              {getActivityIcon(activity.type)}
            </div>

            {/* Activity Details */}
            <div className="flex-1 min-w-0">
              {activity.actorProfilePictureUrl && (
                <img
                  src={activity.actorProfilePictureUrl}
                  alt={activity.actor}
                  className="w-8 h-8 rounded-full inline-block mr-2"
                />
              )}

              <p className="text-white">
                <span className="font-semibold">{activity.actor}</span>
                {activity.type === 'completion' && ` completed `}
                {activity.type === 'member_joined' && ` ${activity.details}`}
                {activity.type === 'chore_created' && ` created `}
                <span className="text-cyan-400">{activity.details}</span>
                {activity.groupName && (
                  <>
                    <span className="text-slate-400"> in </span>
                    <span className="text-blue-400">{activity.groupName}</span>
                  </>
                )}
              </p>
            </div>

            {/* Timestamp */}
            <div className="flex-shrink-0 text-right">
              <p className="text-slate-400 text-sm">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MemberActivities;
