import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Plus, UserPlus, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { axiosInstance, API_URL } from '../../services/axiosConfig';

interface Activity {
  type: 'completion' | 'chore_created' | 'member_joined';
  timestamp: string;
  actor: string;
  actorUsername: string;
  actorUserId?: string;
  groupName: string;
  groupId: number;
  details: string;
  actorProfilePictureUrl: string;
}

const Activities: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hubConnectionRef = useRef<HubConnection | null>(null);
  const userGroupsRef = useRef<number[]>([]);

  // Fetch initial activities and setup SignalR connection
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/groups/recent-activities?limit=15');
        setActivities(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch activities:', err);
        setError('Failed to load activities');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserGroups = async () => {
      try {
        const response = await axiosInstance.get('/api/groups/my-groups');
        userGroupsRef.current = response.data.map((group: any) => group.id);
      } catch (err) {
        console.error('Failed to fetch user groups:', err);
      }
    };

    const setupSignalR = async () => {
      try {
        // Wait for groups to be loaded
        await fetchUserGroups();

        const connection = new HubConnectionBuilder()
          .withUrl(`${API_URL}/choreHub`, {
            withCredentials: true,
          })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Warning)
          .build();

        // Register handler for real-time activity updates
        connection.on('ActivityCreated', (activity: Activity) => {
          // Only add activities from groups the user is a member of
          if (userGroupsRef.current.includes(activity.groupId)) {
            setActivities((prevActivities) => {
              // Add new activity to the top and limit to 15 items
              const updated = [activity, ...prevActivities].slice(0, 15);
              return updated;
            });
          }
        });

        connection.onreconnecting(() => {
          console.log('SignalR reconnecting...');
        });

        connection.onreconnected(() => {
          console.log('SignalR reconnected');
          // Re-join groups after reconnection
          userGroupsRef.current.forEach((groupId) => {
            connection.invoke('JoinGroup', groupId.toString()).catch((err) =>
              console.error(`Failed to join group ${groupId}:`, err)
            );
          });
        });

        await connection.start();
        console.log('SignalR connected');

        // Join all user groups
        for (const groupId of userGroupsRef.current) {
          await connection.invoke('JoinGroup', groupId.toString()).catch((err) =>
            console.error(`Failed to join group ${groupId}:`, err)
          );
        }

        hubConnectionRef.current = connection;
      } catch (err) {
        console.error('Failed to setup SignalR connection:', err);
      }
    };

    fetchActivities();
    setupSignalR();

    // Cleanup on unmount
    return () => {
      if (hubConnectionRef.current) {
        hubConnectionRef.current.stop().catch((err) => console.error('Failed to stop SignalR:', err));
      }
    };
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completion':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'chore_created':
        return <Plus className="w-5 h-5 text-blue-400" />;
      case 'member_joined':
        return <UserPlus className="w-5 h-5 text-cyan-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatActivityTime = (timestamp: string | number) => {
    try {
      // Handle both string and number timestamps
      const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'just now';
      }

      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      console.error('Error formatting timestamp:', err, timestamp);
      return 'just now';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'completion':
        return 'border-l-green-400';
      case 'chore_created':
        return 'border-l-blue-400';
      case 'member_joined':
        return 'border-l-cyan-400';
      default:
        return 'border-l-gray-400';
    }
  };

  const getActivityMessage = (activity: Activity) => {
    switch (activity.type) {
      case 'completion':
        return `${activity.actor} completed "${activity.details}"`;
      case 'chore_created':
        return `New chore "${activity.details}" created`;
      case 'member_joined':
        return `${activity.actor} joined the group`;
      default:
        return 'Activity occurred';
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-8 flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Recent Activities
        </h3>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-8 flex items-center gap-2">
        <Clock className="w-5 h-5 text-cyan-400" />
        <span>Recent Activities</span>
      </h3>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded p-4 text-red-300 mb-4">
          {error}
        </div>
      )}

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No recent activities in your groups</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity, index) => (
            <div
              key={index}
              className={`flex items-start space-x-4 p-4 bg-slate-700/50 border-l-4 ${getActivityColor(
                activity.type
              )} rounded hover:bg-slate-700 transition-colors`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">
                      {getActivityMessage(activity)}
                    </p>
                    <p className="text-cyan-400 text-xs mt-1">
                      in <span className="font-semibold">{activity.groupName}</span>
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right ml-2">
                    <p className="text-gray-400 text-xs whitespace-nowrap">
                      {formatActivityTime(activity.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Actor info for activities with actors */}
                {activity.actor && (
                  <div
                    className="flex items-center space-x-2 mt-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      if (activity.actorUserId) {
                        navigate(`/member/${activity.actorUserId}`);
                      }
                    }}
                  >
                    {activity.actorProfilePictureUrl && (
                      <img
                        src={activity.actorProfilePictureUrl}
                        alt={activity.actor}
                        className="w-5 h-5 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-avatar.jpeg';
                        }}
                      />
                    )}
                    <span className="text-gray-400 text-xs">
                      @{activity.actorUsername}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Activities;
