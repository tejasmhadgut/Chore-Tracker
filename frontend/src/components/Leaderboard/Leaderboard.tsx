import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../../services/axiosConfig';
import { useAuth } from '../../context/AuthContext';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string | null;
  completionCount: number;
  totalPoints: number;
  pointsPercentage: number;
  consecutiveDays: number;
}

// Backend response uses camelCase for all properties
interface LeaderboardEntryResponse {
  rank: number;
  userId: string;
  userName: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string | null;
  completionCount: number;
  totalPoints: number;
  pointsPercentage: number;
  consecutiveDays: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntryResponse[];
  completedChores: Array<{
    choreName: string;
    choreDescription: string;
    difficulty: number;
    completedBy: Array<{ userName: string; completedOn: string }>;
  }>;
  summary: {
    totalCompletions: number;
    totalPoints: number;
    topPerformer: string;
  };
}

interface LeaderboardProps {
  groupId: number;
}

type TimePeriod = 'week' | 'month' | 'all';

const getTrophyIcon = (rank: number): string => {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
};

const getDateRange = (period: TimePeriod): { startDate: string; endDate: string } => {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'all':
      startDate = new Date('2020-01-01');
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

const Leaderboard: React.FC<LeaderboardProps> = ({ groupId }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryResponse[]>([]);
  const [summary, setSummary] = useState<{ totalCompletions: number; totalPoints: number; topPerformer: string } | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const { startDate, endDate } = getDateRange(timePeriod);
        const response = await axiosInstance.get<any>(
          `/api/groups/${groupId}/leaderboard`,
          {
            params: { startDate, endDate },
          }
        );

        setLeaderboard(response.data.leaderboard || []);
        setSummary(response.data.summary || null);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [groupId, timePeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-400">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-slate-400 mb-2">No completions yet</p>
          <p className="text-slate-500 text-sm">Complete some chores to see the leaderboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'all'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setTimePeriod(period)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              timePeriod === period
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-600">
            <p className="text-slate-400 text-sm mb-1">Total Completions</p>
            <p className="text-3xl font-bold text-cyan-400">{summary.totalCompletions}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-600">
            <p className="text-slate-400 text-sm mb-1">Total Points</p>
            <p className="text-3xl font-bold text-yellow-400">{summary.totalPoints}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-600">
            <p className="text-slate-400 text-sm mb-1">Top Performer</p>
            <p className="text-2xl font-bold text-purple-400">{summary.topPerformer || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="rounded-lg overflow-hidden border border-slate-600">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Member</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Points</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Completions</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {leaderboard.map((entry) => {
                const isCurrentUser = user?.id === entry.userId;
                return (
                  <tr
                    key={entry.userId}
                    className={`${
                      isCurrentUser
                        ? 'bg-cyan-600/20 border-l-4 border-l-cyan-400'
                        : 'bg-slate-800/30 hover:bg-slate-800/50'
                    } transition-colors`}
                  >
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getTrophyIcon(entry.rank) && (
                          <span className="text-2xl">{getTrophyIcon(entry.rank)}</span>
                        )}
                        <span className="font-bold text-white">{entry.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={entry.profilePictureUrl || '/default-avatar.jpeg'}
                          alt={`${entry.firstName} ${entry.lastName}`}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-600"
                        />
                        <div>
                          <p className="font-medium text-white">
                            {entry.firstName} {entry.lastName}
                          </p>
                          <p className="text-sm text-slate-400">@{entry.userName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div>
                        <p className="font-bold text-yellow-400 text-lg">{entry.totalPoints}</p>
                        <p className="text-xs text-slate-400">{entry.pointsPercentage.toFixed(1)}%</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-cyan-300">{entry.completionCount}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-orange-400">{entry.consecutiveDays} days</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
