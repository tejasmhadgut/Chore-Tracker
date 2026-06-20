import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Group, Member } from '../types/types';
import { getGroupList } from '../../services/GroupService';
import { FiUser, FiMail, FiUsers, FiEdit, FiLock, FiCamera, FiArrowLeft } from 'react-icons/fi';

const ProfileDetail: React.FC = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [profilePicture, setProfilePicture] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const fetchProfilePicture = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5178/api/aws/profile-picture', {
                withCredentials: true,
            });

            const url = response.data.url;
            const isDefault = response.data.isDefault || false;

            // Only cache non-default images (default doesn't expire)
            if (!isDefault && url.includes('Expires=')) {
                const expiresMatch = url.match(/Expires=(\d+)/);
                const expiresAt = expiresMatch ? parseInt(expiresMatch[1], 10) * 1000 : Date.now() + 3600000;

                sessionStorage.setItem("profilePicture", url);
                sessionStorage.setItem("profilePictureExpiry", expiresAt.toString());
            }

            setProfilePicture(url);
        } catch (error) {
            console.error("Failed to fetch profile picture:", error);
            // Fallback to default if API fails
            setProfilePicture("/default-avatar.jpeg");
            sessionStorage.removeItem("profilePicture");
            sessionStorage.removeItem("profilePictureExpiry");
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check sessionStorage first
                const storedUrl = sessionStorage.getItem("profilePicture");
                const storedExpiry = sessionStorage.getItem("profilePictureExpiry");
                const now = Date.now();

                // Fetch groups
                const groupData = await getGroupList();
                setGroups(groupData);

                if (storedUrl && storedExpiry && now < parseInt(storedExpiry, 10)) {
                    setProfilePicture(storedUrl);
                } else if (user) {
                    await fetchProfilePicture();
                }
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, fetchProfilePicture]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Client-side validation
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only JPG, PNG, and GIF images are allowed');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            setError('');

            // Upload new profile picture
            const uploadResponse = await axios.post(
                'http://localhost:5178/api/aws/upload-profile-picture',
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );

            // Update session storage and state with new URL
            const newUrl = uploadResponse.data.url;
            const expiresMatch = newUrl.match(/Expires=(\d+)/);
            const expiresAt = expiresMatch ? parseInt(expiresMatch[1], 10) * 1000 : Date.now() + 3600000;
            
            sessionStorage.setItem("profilePicture", newUrl);
            sessionStorage.setItem("profilePictureExpiry", expiresAt.toString());
            setProfilePicture(newUrl);

            // Update user context
            const newUserData: Member = { ...user, profilePictureUrl: newUrl };
            setUser(newUserData);

        } catch (error) {
            console.error('Upload failed:', error);
            setError('Failed to upload profile picture. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleImageError = () => {
        // Use default avatar on error
        setProfilePicture("/default-avatar.jpeg");
        sessionStorage.removeItem("profilePicture");
        sessionStorage.removeItem("profilePictureExpiry");
    };


  if (!user) return <div>Loading user data...</div>;

  // Extract unique chore buddies from group members
  const choreBuddies = groups
    .flatMap((group) => group.members)
    .filter((member) => member.user?.email !== user.email)
    .reduce((unique, member) => {
      const buddyEmail = member.user?.email;
      if (buddyEmail && !unique.some((m) => m.user?.email === buddyEmail)) {
        // Create a Member object from the user data
        const buddy: Member = {
          userId: member.user.id,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          email: member.user.email,
          username: member.user.userName,
          profilePictureUrl: member.user.profilePictureUrl
        };
        unique.push(buddy);
      }
      return unique;
    }, [] as Member[]);

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 bg-red-900/80 border border-red-700 text-red-200 px-4 py-3 rounded-lg shadow-lg animate-pulse">
          {error}
        </div>
      )}

      <div className="min-h-screen w-full bg-slate-900/50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-cyan-300 hover:text-cyan-200 transition-all"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          {/* Header Section with Avatar */}
          <div className="mb-8">
            <div className="bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-700 border-t-2 border-t-cyan-500">
              {/* Gradient Header */}
              <div className="h-32 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700"></div>

              {/* Profile Content */}
              <div className="px-6 md:px-8 pb-6">
                <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 mb-6">
                  {/* Avatar Section */}
                  <div className="relative">
                    <img
                      src={profilePicture || "/default-avatar.jpeg"}
                      onError={() => setProfilePicture("/default-avatar.jpeg")}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-cyan-400 shadow-xl"
                    />
                    <label
                      htmlFor="profile-picture"
                      className={`absolute bottom-0 right-0 bg-cyan-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition-all ${
                        uploading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-cyan-500 hover:shadow-xl hover:shadow-cyan-500/50'
                      }`}
                      title="Upload profile picture"
                    >
                      {uploading ? (
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                      ) : (
                        <FiCamera className="h-5 w-5" />
                      )}
                    </label>
                    <input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                      {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-cyan-300 text-base flex items-center gap-2 font-medium">
                      <FiUser className="w-4 h-4" />
                      @{user.username}
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="bg-slate-700/50 p-4 rounded-xl border-2 border-slate-600 hover:border-cyan-500/50 transition-colors shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <FiMail className="w-5 h-5 text-cyan-400" />
                      <span className="text-cyan-300 text-sm font-medium">Email</span>
                    </div>
                    <p className="text-gray-100 font-semibold break-all">{user.email}</p>
                  </div>

                  <div className="bg-slate-700/50 p-4 rounded-xl border-2 border-slate-600 hover:border-cyan-500/50 transition-colors shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <FiUser className="w-5 h-5 text-cyan-400" />
                      <span className="text-cyan-300 text-sm font-medium">Username</span>
                    </div>
                    <p className="text-gray-100 font-semibold font-mono">{user.username}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Actions Section */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 rounded-2xl shadow-lg p-6 h-full border border-slate-700 border-t-2 border-t-cyan-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-cyan-600/20 rounded-lg">
                    <FiEdit className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Actions</h3>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-cyan-600 text-white py-3 rounded-lg font-semibold hover:bg-cyan-500 transition-all shadow-md hover:shadow-lg hover:shadow-cyan-500/50 flex items-center justify-center gap-2">
                    <FiEdit className="w-4 h-4" />
                    Edit Profile
                  </button>
                  <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                    <FiLock className="w-4 h-4" />
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Chore Buddies Section */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700 border-t-2 border-t-cyan-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-cyan-600/20 rounded-lg">
                    <FiUsers className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Chore Buddies</h3>
                  {choreBuddies.length > 0 && (
                    <span className="ml-auto bg-cyan-600/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-semibold">
                      {choreBuddies.length}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
                      <p className="text-gray-400">Loading buddies...</p>
                    </div>
                  </div>
                ) : choreBuddies.length === 0 ? (
                  <div className="bg-slate-700/30 rounded-xl p-8 text-center border-2 border-dashed border-slate-600">
                    <FiUsers className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-300 font-medium">No chore buddies yet</p>
                    <p className="text-gray-400 text-sm mt-1">Join groups to connect with others</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {choreBuddies.map((buddy, index) => (
                      <div
                        key={index}
                        className="group bg-slate-700/50 border border-slate-600 p-4 rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer"
                        onClick={() => buddy.userId && navigate(`/member/${buddy.userId}`)}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={buddy.profilePictureUrl || "/default-avatar.jpeg"}
                            alt={`${buddy.firstName} ${buddy.lastName}`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-600 shadow-md group-hover:border-cyan-400 transition-all group-hover:scale-105"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-100 truncate group-hover:text-cyan-300 transition-colors">
                              {buddy.firstName} {buddy.lastName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">@{buddy.username}</p>
                          </div>
                        </div>

                        {/* Hover Details */}
                        <div className="mt-3 pt-3 border-t border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity max-h-0 group-hover:max-h-32 overflow-hidden">
                          <div className="space-y-2 text-xs">
                            <div className="flex items-start gap-2">
                              <FiMail className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-300 break-all">{buddy.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileDetail;