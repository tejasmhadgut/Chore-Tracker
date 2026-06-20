import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMemberProfile,
  getMemberSharedGroups,
  getMemberActivities,
  getMemberStatistics,
} from '../services/MemberService';
import { MemberProfile, SharedGroup, MemberStatistics, Activity } from '../components/types/types';
import MemberProfileDetails from '../components/Profile/MemberProfileDetails';
import SharedGroupsList from '../components/Profile/SharedGroupsList';
import MemberActivities from '../components/Profile/MemberActivities';
import MemberStatisticsComponent from '../components/Profile/MemberStatistics';

type TabType = 'overview' | 'groups' | 'activities';

const MemberProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [sharedGroups, setSharedGroups] = useState<SharedGroup[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [statistics, setStatistics] = useState<MemberStatistics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemberData = async () => {
      if (!userId) {
        setError('Invalid user ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [profileData, groupsData, activitiesData, statsData] = await Promise.all([
          getMemberProfile(userId),
          getMemberSharedGroups(userId),
          getMemberActivities(userId, 15),
          getMemberStatistics(userId),
        ]);

        setProfile(profileData);
        setSharedGroups(groupsData);
        setActivities(activitiesData);
        setStatistics(statsData);
      } catch (err: any) {
        console.error('Error loading member profile:', err);
        const errorMessage = err?.message || err?.response?.data?.message || 'Failed to load member profile';
        const status = err?.response?.status;

        if (status === 404 || errorMessage.includes('not found')) {
          setError('User not found');
        } else if (status === 403 || errorMessage.includes('share groups')) {
          setError('You can only view profiles of members you share groups with');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Oops!</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header with back button */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
          >
            <span className="mr-2">←</span> Back
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        {profile && <MemberProfileDetails profile={profile} statistics={statistics} />}

        {/* Tab Navigation */}
        <div className="mt-8 border-b border-slate-700">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'text-cyan-400 border-cyan-500'
                  : 'text-slate-400 hover:text-slate-300 border-transparent'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'groups'
                  ? 'text-cyan-400 border-cyan-500'
                  : 'text-slate-400 hover:text-slate-300 border-transparent'
              }`}
            >
              Shared Groups ({sharedGroups.length})
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'activities'
                  ? 'text-cyan-400 border-cyan-500'
                  : 'text-slate-400 hover:text-slate-300 border-transparent'
              }`}
            >
              Activities
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'overview' && statistics && (
            <MemberStatisticsComponent statistics={statistics} />
          )}

          {activeTab === 'groups' && (
            <SharedGroupsList groups={sharedGroups} />
          )}

          {activeTab === 'activities' && (
            <MemberActivities activities={activities} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProfilePage;
