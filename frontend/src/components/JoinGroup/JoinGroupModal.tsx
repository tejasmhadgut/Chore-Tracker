import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getGroupByInvite, handleJoin } from '../../services/GroupService';
import { Group } from '../types/types';
import { LogIn } from 'lucide-react';

const JoinGroupModal = ({ isOpen, setIsOpen, refreshGroups }: { 
    isOpen: boolean; 
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    refreshGroups: () => void;  // ✅ Fix: Correct function type
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [groupDetails, setGroupDetails] = useState<Group>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleAcceptInvitation = async () => {
    if (!groupDetails) return;

    try {
      await handleJoin(groupDetails.id);
      
      refreshGroups();  // Refresh the groups after joining
      setIsOpen(false);  // Close the modal after successfully joining
    } catch (err: unknown) {
      console.log(err);
      setError('Failed to join the group. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="bg-slate-900/20 backdrop-blur p-8 fixed inset-0 z-50 grid place-items-center overflow-y-scroll cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0, rotate: '12.5deg' }}
            animate={{ scale: 1, rotate: '0deg' }}
            exit={{ scale: 0, rotate: '0deg' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-r from-[#3c5ab3] to-[#082c74] text-white p-6 rounded-lg w-full max-w-lg shadow-xl cursor-default overflow-hidden relative"
          >
            {/* Background Icon */}
            
            <div className="relative z-10">
              {/* Foreground Icon */}
              <div className="bg-gray-300 w-16 h-16 mb-2  rounded-full text-emerald-950   grid place-items-center mx-auto">
                <LogIn />
              </div>

              <h3 className="text-3xl font-bold text-center mb-4">Join a Group</h3>

              {!groupDetails ? (
                <>
                  <input
                    type="text"
                    className="w-full p-2 mb-4 rounded-lg border bg-gradient-to-r from-[#7e95db] to-[#0e3b95] backdrop-blur-lg bg-opacity-50 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 placeholder-gray-100"
                    placeholder="Enter Invite Code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                  <button
                    onClick={handleJoinGroup}
                    className={`w-full font-bold text-[#0a3281] cursor-pointer py-2 rounded ${loading ? 'bg-gray-400' : 'bg-gray-300 hover:hover:opacity-90 transition-opacity'} text-emerald-950`}
                    disabled={loading}
                  >
                    {loading ? 'Joining...' : 'Join'}
                  </button>
                  {error && <p className="text-red-500 text-center mt-2">{error}</p>}
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <h4 className="font-bold text-lg">Group Name: {groupDetails.name}</h4>
                    <p>{groupDetails.description}</p>
                    <p className="font-bold text-lg">
                        Created At: {new Date(groupDetails.createdAt).toLocaleDateString()}
                    </p>
                    <p className="font-bold text-lg">Members:</p>
                    <ul>
                      {groupDetails.memberNames.map((name, index) => (
                        <li key={index} className="font-bold text-lg">
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={handleAcceptInvitation}
                    className="w-full py-2 rounded bg-green-600 hover:opacity-80 transition-opacity text-white"
                  >
                    Accept Invitation
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JoinGroupModal;
