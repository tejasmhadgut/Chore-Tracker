import React, {  useEffect, useState, useCallback, useRef } from 'react'
import {  useParams, useNavigate } from 'react-router'
import Board from '../components/KanbanBoard/Kanban/Board';
import Leaderboard from '../components/Leaderboard/Leaderboard';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
//import { useGroups } from '../context/GroupContext';
import { getGroupDetails } from '../services/GroupService';
import { useAuth } from '../context/AuthContext';
import { BarChart3, ArrowLeft, Trophy } from 'lucide-react';
import Footer from '../components/Footer/Footer';


export interface Member {
  //firstName: string;
  //lastName: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
}

export interface GroupDetails {
  id: number;
  name: string;
  inviteCode: string;
  description: string;
  members: Member[];
  createdAt: string;
}

const GroupDetailsPage = () => {
  const { groupId } = useParams<{ groupId?: string }>(); // Keep it as string
  const navigate = useNavigate();
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [boardKey, setBoardKey] = useState(0);
  const [isHoveringCopyButton, setIsHoveringCopyButton] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'leaderboard'>('board');
  const {user} = useAuth();
  const isFetchingRef = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  //const {groups} = useGroups();

  const fetchGroupDetails = useCallback(async (id: string) => {
    // Prevent duplicate simultaneous fetches
    if (isFetchingRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }

    isFetchingRef.current = true;
    try {
      console.log("Fetching group details for group:", id);
      const groupDetail = await getGroupDetails(parseInt(id));
      console.log("groupDetails + "+groupDetail.data.name);
      setGroupDetails(groupDetail.data || null);
    } catch (error) {
      console.error("Failed to get group details", error);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Debounced refresh function to prevent rapid board remounts
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      setBoardKey(prev => prev + 1);
      console.log("Board refreshed via SignalR (debounced)");
    }, 2000);  // 2-second debounce
  }, []);

  useEffect(()=>{
    if (!groupId) return;
    fetchGroupDetails(groupId);
  }, [groupId]);

  useEffect(() => {
    let newConnection: HubConnection | null = null;
    let isMounted = true;

    const setupConnection = async () => {
      if (!groupId || !isMounted) return;

      try {
        newConnection = new HubConnectionBuilder()
          .withUrl(`${import.meta.env.VITE_API_URL}/chorehub`)
          .configureLogging(LogLevel.Error)
          .withAutomaticReconnect()
          .build();

        // Completely clear and rebuild handlers
        newConnection.off("ChoreUpdated");
        newConnection.off("ChoreCreated");
        newConnection.off("ChoreDeleted");

        newConnection.on("ChoreUpdated", () => {
          if (!isMounted) return;
          console.log("Websocket: ChoreUpdated");
          debouncedRefresh();
        });
        newConnection.on("ChoreCreated", () => {
          if (!isMounted) return;
          console.log("Websocket: ChoreCreated");
          debouncedRefresh();
        });
        newConnection.on("ChoreDeleted", () => {
          if (!isMounted) return;
          console.log("Websocket: ChoreDeleted");
          debouncedRefresh();
        });

        await newConnection.start();
        await newConnection.invoke("JoinGroup", `Group-${groupId}`);

        if (isMounted) {
          setConnection(newConnection);
        }
      } catch (e) {
        console.error('Connection setup failed:', e);
        if (newConnection) {
          newConnection.stop().catch(() => {});
        }
      }
    };

    setupConnection();

    return () => {
      isMounted = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (newConnection) {
        try {
          newConnection.off("ChoreUpdated");
          newConnection.off("ChoreCreated");
          newConnection.off("ChoreDeleted");
          newConnection.stop();
        } catch (err) {
          // Silently fail
        }
      }
    };
  }, [groupId]);
  
/*
  useEffect(() => {
    fetchGroups();
    if (groupId) fetchGroupDetails(groupId);
  }, [groupId, fetchGroupDetails]);
*/
  

  return (
    <div className="min-h-screen bg-slate-900/50 flex flex-col">
      <div className='flex-1 overflow-y-auto'>
        {/* Back Button */}
        <div className="flex px-4 pt-6 max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-cyan-300 hover:text-cyan-200 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        {/* Centered Container for Board & Members */}
        <div className="flex flex-col items-center w-full pt-6">
    <div className="w-full max-w-7xl px-1 flex flex-col md:flex-row gap-6">
      {/* Left Column - Group Details & Members */}
      <div className="w-full md:w-1/5 flex flex-col gap-5">
        {/* Group Info Card */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-700 border-t-2 border-t-cyan-500">
          <h2 className="text-2xl font-bold text-white mb-3">
            {groupDetails?.name || "Group Name"}
          </h2>
          <p className="text-gray-400 mb-4">
            {groupDetails?.description || "Group description"}
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-medium">Invite Code:</span>
              <div className="relative">
                <div className='flex items-center'>

          <button
            className="relative text-cyan-400 hover:text-cyan-300"
            onMouseEnter={() => setIsHoveringCopyButton(true)}
            onMouseLeave={() => setIsHoveringCopyButton(false)}
            onClick={() => {
              navigator.clipboard.writeText(groupDetails?.inviteCode || '');
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
          >
            <span
              className={`absolute -top-8 left-0 font-mono bg-slate-700 px-3 py-1 rounded-md text-cyan-300 shadow-md transition-opacity duration-200 ${
                isHoveringCopyButton ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {groupDetails?.inviteCode}
            </span>

                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                </div>
                {isCopied && (
                          <span className="ml-2 text-sm text-green-600">Copied!</span>
                        )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-medium">Created:</span>
              <span className="text-gray-100">
                {groupDetails?.createdAt ? new Date(groupDetails.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Members Card */}
        <div className="rounded-xl p-6 shadow-sm bg-slate-800 border border-slate-700 border-t-2 border-t-cyan-500">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><span className="p-2 bg-cyan-600/20 rounded-lg inline-flex"><svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-2a6 6 0 0112 0v2zm4.97-10.338A8 8 0 1023 12c0-.464-.033-.923-.1-1.376M21 19h2m-2-4h2m-9-9h.01M9 9h.01" /></svg></span>Members</h3>
          <div className="space-y-3">
            {groupDetails?.members?.filter(member=> member.email !== user?.email)?.map((member: Member, index: number) => (
              <div
                key={index}
                className="flex items-center bg-slate-700/50 p-3 rounded-lg hover:shadow-md hover:shadow-cyan-500/20 hover:border hover:border-cyan-500/50 transition-all cursor-pointer"
                onClick={() => member.userId && navigate(`/member/${member.userId}`)}
              >
                <img
                  src={member.profilePictureUrl || "/default-avatar.jpeg"}
                  alt={`${member.firstName} ${member.lastName}'s profile`}
                  className="w-10 h-10 rounded-full object-cover mr-3 border-2 border-slate-600 hover:border-cyan-400 transition-all hover:scale-105"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-100 truncate hover:text-cyan-300 transition-colors">{member.firstName} {member.lastName}</p>
                  <p className="text-sm text-gray-400 truncate">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Board/Leaderboard Section */}
      <div className="w-full md:w-4/5 mb-2 flex flex-col flex-grow">
        <div className="bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-700 border-t-2 border-t-cyan-500 h-full flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="flex gap-2 bg-slate-700/50 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('board')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                    activeTab === 'board'
                      ? 'bg-cyan-600/30 text-cyan-300'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Board
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                    activeTab === 'leaderboard'
                      ? 'bg-cyan-600/30 text-cyan-300'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Trophy className="w-5 h-5" />
                  Leaderboard
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/analytics/${groupId}`)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 hover:text-cyan-200 transition-colors font-medium text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <span className="text-sm text-cyan-300 bg-cyan-600/20 px-3 py-1 rounded-full font-medium">
                {groupDetails?.members?.length || 0} members
              </span>
            </div>
          </div>
          {groupId ? (
            <div className="flex-grow">
              {activeTab === 'board' ? (
                <Board key={boardKey} groupId={parseInt(groupId, 10)} />
              ) : (
                <Leaderboard groupId={parseInt(groupId, 10)} />
              )}
            </div>
          ) : (
            <p className="text-gray-400">Invalid group ID</p>
          )}
        </div>
      </div>
    </div>
  </div>
      </div>
      <Footer />
    </div>
  );
};

export default GroupDetailsPage;
