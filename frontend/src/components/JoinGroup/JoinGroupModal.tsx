import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { getGroupByInvite, handleJoin } from '../../services/GroupService';
import { Group } from '../types/types';
import { LogIn, X } from 'lucide-react';
import { useGroups } from '../../context/GroupContext';
import { useNavigate } from 'react-router';

const JoinGroupModal = ({ 
  isOpen, 
  setIsOpen,
}: { 
  isOpen: boolean; 
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [groupDetails, setGroupDetails] = useState<Group>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const {refreshGroups} = useGroups();
  const navigate = useNavigate();
  const handleJoinGroup = async () => {
    if (!inviteCode) return;

    setLoading(true);
    setError('');
    try {
      const group = await getGroupByInvite(inviteCode);
      setGroupDetails(group);
    } catch (err: unknown) {
      console.log(err);
      setError('Failed to fetch group details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleGroupJoined = (newGroupId: number) => {
    const userConfirmed = window.confirm("You have joined a new group. Switch to it now?");
    if (userConfirmed) {
        navigate(`/group-details/${newGroupId}`);
    }
  };
  
  const handleAcceptInvitation = async () => {
    if (!groupDetails) return;

    try {
      await handleJoin(groupDetails.id);
      if(refreshGroups)
      {
        refreshGroups();
      }
      setIsOpen(false);
      
      handleGroupJoined(groupDetails.id);
      
    } catch (err: unknown) {
      console.log(err);
      setError('Failed to join the group. Please try again.');
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] grid place-items-center overflow-y-auto pointer-events-none bg-slate-900/20 backdrop-blur"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.25 }}
            className="w-full max-w-lg p-6 relative pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-3xl rounded-2xl shadow-2xl opacity-[0.95] overflow-hidden border border-cyan-500/50">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 hover:text-white transition-colors font-bold text-white z-50"
              >
                <X size={20} />
              </button>

              <div className="p-2 bg-gradient-to-b from-cyan-600/10 to-slate-800/20 border-b border-cyan-500/30">
                <div className="bg-cyan-600/20 w-14 h-14 mb-2 mt-3 rounded-2xl text-cyan-400 grid place-items-center mx-auto shadow-inner border border-cyan-500/30">
                  <LogIn className="text-cyan-400" size={28} />
                </div>

                <h3 className="text-2xl font-semibold text-center mb-6 text-white">
                  Join a Group
                </h3>

                {!groupDetails ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 px-3"
                  >
                    <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-600 hover:border-cyan-500/50 transition-colors">
                      <input
                        type="text"
                        className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg focus:text-cyan-300 transition-colors"
                        placeholder="Enter Invite Code"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                      />
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-300 text-sm px-4"
                      >
                        {error}
                      </motion.div>
                    )}

                    <button
                      onClick={handleJoinGroup}
                      className={`w-full py-3.5 mb-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 transition-colors text-white font-semibold shadow-lg hover:shadow-cyan-500/50 active:scale-95 transform ${
                        loading ? 'opacity-75' : ''
                      }`}
                      disabled={loading}
                    >
                      {loading ? 'Joining...' : 'Join'}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-600">
                        <h4 className="text-cyan-300 font-medium mb-2">Group Details</h4>
                        <p className="text-white font-semibold">{groupDetails.name}</p>
                        <p className="text-gray-300 text-sm">{groupDetails.description}</p>
                        <p className="text-gray-400 text-sm mt-2">
                          Created: {new Date(groupDetails.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-600">
                        <h4 className="text-cyan-300 font-medium mb-2">Members</h4>
                        <div className="flex flex-wrap gap-2">
                          {groupDetails.members.map((member, index) => (
                            <motion.div
                              key={index}
                              className="bg-cyan-600/20 px-3 py-1.5 rounded-lg text-sm text-cyan-300 border border-cyan-500/30"
                            >
                              {member.firstName} {member.lastName}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleAcceptInvitation}
                      className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 transition-colors text-white font-semibold shadow-lg hover:shadow-cyan-500/50"
                    >
                      Accept Invitation
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default JoinGroupModal;