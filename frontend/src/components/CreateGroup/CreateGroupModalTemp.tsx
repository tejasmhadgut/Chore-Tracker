import { AnimatePresence, motion } from "framer-motion";
import {  Mail, X, Edit2, Users, ChevronDown, ChevronUp, Check } from "lucide-react";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { handleGroupCreate } from "../../services/GroupService";
import { CreateGroup } from "../types/types";
import { useGroups } from "../../context/GroupContext";
import { fetchBuddyRecommendations, Buddy } from "../../services/BuddyService";

const CreateGroupModal = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const {refreshGroups} = useGroups();
  const [confirmedEmails, setConfirmedEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [isNext, setIsNext] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [selectedBuddies, setSelectedBuddies] = useState<Set<string>>(new Set());
  const [loadingBuddies, setLoadingBuddies] = useState(false);
  const [expandBuddies, setExpandBuddies] = useState(true);

  // Fetch buddy recommendations when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBuddies();
    }
  }, [isOpen]);

  const fetchBuddies = async () => {
    setLoadingBuddies(true);
    try {
      const data = await fetchBuddyRecommendations();
      setBuddies(data);
    } catch (err) {
      console.error('Failed to fetch buddies:', err);
      setBuddies([]);
    } finally {
      setLoadingBuddies(false);
    }
  };

  const toggleBuddySelection = (buddyId: string, buddyEmail: string) => {
    const newSelected = new Set(selectedBuddies);

    if (newSelected.has(buddyId)) {
      // Deselect buddy
      newSelected.delete(buddyId);
      setSelectedBuddies(newSelected);
      // Remove from confirmed emails if it was added via buddy selection
      setConfirmedEmails(confirmedEmails.filter(e => e !== buddyEmail));
    } else {
      // Select buddy
      newSelected.add(buddyId);
      setSelectedBuddies(newSelected);
      // Add email if not already present
      if (!confirmedEmails.includes(buddyEmail)) {
        setConfirmedEmails([...confirmedEmails, buddyEmail]);
      }
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const email = currentEmail.trim();
      
      if (!email) return;
      
      if (!isValidEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }

      if (confirmedEmails.includes(email)) {
        setError("This email has already been added");
        return;
      }

      setConfirmedEmails([...confirmedEmails, email]);
      setCurrentEmail("");
      setError("");
    }
  };

  const handleEditEmail = (email: string) => {
    setConfirmedEmails(confirmedEmails.filter(e => e !== email));
    setCurrentEmail(email);
  };

  const handleRemoveEmail = (email: string) => {
    setConfirmedEmails(confirmedEmails.filter(e => e !== email));
  };

  const handleNext = () => {
    if (!title.trim() || !description.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setIsNext(true);
    setError("");
  };

  const handleCreate = async () => {
    try {
      if (confirmedEmails.length === 0) {
        setError("Please add at least one member");
        return;
      }

      const groupCard: CreateGroup = {
        Name: title.trim(),
        Description: description.trim(),
        MemberEmails: confirmedEmails,
      };

      await handleGroupCreate(groupCard);
      if(refreshGroups){
        refreshGroups();
      }
      
      setIsOpen(false);
      
    } catch (err) {
      console.error(err);
      setError("Failed to create group. Please try again.");
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
                  <Users className="text-cyan-400" size={28} />
                </div>

                <h3 className="text-2xl font-semibold text-center mb-6 text-white">
                  Create a Group
                </h3>

                {!isNext ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 px-3"
                  >
                    <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-600 hover:border-cyan-500/50 transition-colors">
                      <input
                        type="text"
                        className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg focus:text-cyan-300 transition-colors"
                        placeholder="Group Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-600 hover:border-cyan-500/50 transition-colors">
                      <input
                        type="text"
                        className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg focus:text-cyan-300 transition-colors"
                        placeholder="Group Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
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
                      onClick={handleNext}
                      className="w-full py-3.5 mb-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 transition-colors text-white font-semibold shadow-lg hover:shadow-cyan-500/50 active:scale-95 transform transition-all"
                    >
                      Continue
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
                        <p className="text-white font-semibold">{title}</p>
                        <p className="text-gray-300 text-sm">{description}</p>
                      </div>

                      {/* Chore Buddies Section */}
                      {buddies.length > 0 && (
                        <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl shadow-sm border border-slate-600 overflow-hidden">
                          <button
                            onClick={() => setExpandBuddies(!expandBuddies)}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-600/30 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Users size={18} className="text-cyan-400" />
                              <h4 className="text-cyan-300 font-medium">
                                Chore Buddies ({selectedBuddies.size})
                              </h4>
                            </div>
                            {expandBuddies ? (
                              <ChevronUp size={18} className="text-cyan-400" />
                            ) : (
                              <ChevronDown size={18} className="text-cyan-400" />
                            )}
                          </button>

                          {expandBuddies && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-slate-600 p-4 space-y-3"
                            >
                              {loadingBuddies ? (
                                <div className="flex justify-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-cyan-400"></div>
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {buddies.map((buddy) => (
                                    <motion.button
                                      key={buddy.id}
                                      onClick={() => toggleBuddySelection(buddy.id, buddy.email)}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                                        selectedBuddies.has(buddy.id)
                                          ? 'bg-cyan-600/30 border border-cyan-500/50'
                                          : 'bg-slate-600/20 border border-slate-600 hover:border-cyan-500/30'
                                      }`}
                                    >
                                      {buddy.profilePictureUrl ? (
                                        <img
                                          src={buddy.profilePictureUrl}
                                          alt={buddy.firstName}
                                          className="w-8 h-8 rounded-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/default-avatar.jpeg';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-cyan-600/30 flex items-center justify-center text-xs font-semibold text-cyan-300">
                                          {buddy.firstName.charAt(0)}{buddy.lastName.charAt(0)}
                                        </div>
                                      )}

                                      <div className="flex-1 text-left min-w-0">
                                        <p className="text-white font-medium truncate">
                                          {buddy.firstName} {buddy.lastName}
                                        </p>
                                        <p className="text-gray-400 text-xs truncate">@{buddy.userName}</p>
                                      </div>

                                      {selectedBuddies.has(buddy.id) && (
                                        <Check size={18} className="text-cyan-400 flex-shrink-0" />
                                      )}
                                    </motion.button>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* Email Input Section */}
                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-600">
                        <div className="flex items-center gap-2 mb-3">
                          <Mail size={18} className="text-cyan-400" />
                          <h4 className="text-cyan-300 font-medium text-sm">
                            Add more members by email
                          </h4>
                        </div>

                        <div className="relative mb-4">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" size={18} />
                          <input
                            type="email"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 rounded-lg border border-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 text-white placeholder-gray-400 transition-colors"
                            placeholder="Enter email and press Enter..."
                            value={currentEmail}
                            onChange={(e) => setCurrentEmail(e.target.value)}
                            onKeyDown={handleEmailKeyPress}
                          />
                        </div>

                        {confirmedEmails.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-gray-400 text-xs">Members to invite:</p>
                            <div className="flex flex-wrap gap-2">
                              {confirmedEmails.map((email) => (
                                <motion.div
                                  key={email}
                                  initial={{ scale: 0.9 }}
                                  animate={{ scale: 1 }}
                                  className="bg-cyan-600/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm border border-cyan-500/30"
                                >
                                  <span className="text-cyan-300">{email}</span>
                                  <button
                                    onClick={() => handleEditEmail(email)}
                                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveEmail(email)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-300 text-sm px-2"
                      >
                        {error}
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pb-4">
                      <button
                        onClick={() => setIsNext(false)}
                        className="py-3 rounded-xl bg-slate-600 hover:bg-slate-500 transition-colors text-white font-medium shadow-sm"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCreate}
                        className="py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 transition-colors text-white font-semibold shadow-lg hover:shadow-cyan-500/50"
                      >
                        Create Group
                      </button>
                    </div>
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

export default CreateGroupModal;