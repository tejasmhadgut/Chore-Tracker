import React from 'react';
import { MemberProfile, MemberStatistics } from '../types/types';

interface MemberProfileDetailsProps {
  profile: MemberProfile;
  statistics: MemberStatistics | null;
}

const MemberProfileDetails: React.FC<MemberProfileDetailsProps> = ({ profile, statistics }) => {
  return (
    <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-xl border border-slate-600 p-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img
            src={profile.profilePictureUrl || '/default-avatar.jpeg'}
            alt={`${profile.firstName} ${profile.lastName}`}
            className="w-32 h-32 rounded-full object-cover border-2 border-cyan-500 shadow-lg"
          />
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-white mb-2">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-lg text-cyan-400 mb-2">@{profile.username}</p>
          <p className="text-slate-300 mb-6">{profile.email}</p>

          {/* Quick Stats */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-600/50 rounded-lg p-3">
                <p className="text-slate-400 text-sm">Chores Completed</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {statistics?.totalChoresCompleted ?? 0}
                </p>
              </div>
              <div className="bg-slate-600/50 rounded-lg p-3">
                <p className="text-slate-400 text-sm">Completion Rate</p>
                <p className="text-2xl font-bold text-green-400">
                  {(statistics?.completionRate ?? 0).toFixed(1)}%
                </p>
              </div>
              <div className="bg-slate-600/50 rounded-lg p-3">
                <p className="text-slate-400 text-sm">Current Streak</p>
                <p className="text-2xl font-bold text-orange-400">
                  {statistics?.recentStreak ?? 0} days
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProfileDetails;
