import { AnimatePresence, motion } from "framer-motion";
import {  Mail, X, Edit2, Users } from "lucide-react";
import React, { useState } from "react";
import { handleGroupCreate } from "../../services/GroupService";
import { CreateGroup } from "../types/types";

const CreateGroupModal = ({
  isOpen,
  setIsOpen,
  refreshGroups,
  onGroupJoined,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refreshGroups?: () => void;
  onGroupJoined?: (groupId: number) => void;
}) => {
  const [confirmedEmails, setConfirmedEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [isNext, setIsNext] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

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

      const createdGroup = await handleGroupCreate(groupCard);
      if(refreshGroups){
        refreshGroups();
      }
      
      setIsOpen(false);
      
      if (onGroupJoined) {
        onGroupJoined(createdGroup.id);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to create group. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center overflow-y-scroll cursor-pointer bg-slate-900/20 backdrop-blur"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.25 }}
            className="w-full max-w-lg p-6 relative"
          >
            <div className="bg-gradient-to-r from-[#3c5ab3] to-[#082c74] backdrop-blur-3xl rounded-2xl shadow-2xl opacity-[0.93] overflow-hidden border border-blue-500/90">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-[#8499db] hover:bg-blue-900/90 hover:text-gray-400 transition-colors font-bold text-[#082c74] z-50"
            >
              <X size={20} />
            </button>
              <div className="p-2 bg-gradient-to-b from-blue-400/20 to-blue-600/10">
                <div className="bg-[#8499db]  w-14 h-14 mb-2 mt-3 rounded-2xl text-[#082c74] grid place-items-center mx-auto shadow-inner">
                  <Users className="text-[#082c74]" size={28} />
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
                    <div className="bg-gradient-to-r from-[#7e95db] to-[#0e3b95] backdrop-blur-sm rounded-xl p-4 shadow-sm border border-blue-200/30">
                      <input
                        type="text"
                        className="w-full bg-transparent text-white placeholder-gray-200 focus:outline-none text-lg"
                        placeholder="Group Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="bg-gradient-to-r from-[#7e95db] to-[#0e3b95] backdrop-blur-sm rounded-xl p-4 shadow-sm border border-blue-200/30">
                      <input
                        type="text"
                        className="w-full bg-transparent text-white placeholder-gray-200 focus:outline-none text-lg"
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
                      className="w-full py-3.5 mb-2 opacity-[0.90] rounded-xl bg-gray-300 hover:bg-gray-400 transition-colors text-[#0a3281] font-semibold shadow-lg active:scale-95 transform transition-all"
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
                      <div className="bg-gradient-to-r from-[#7e95db] to-[#0e3b95] backdrop-blur-sm rounded-xl p-4 shadow-sm border border-blue-200/30">
                        <h4 className="text-gray-200 font-medium mb-2">Group Details</h4>
                        <p className="text-white font-semibold">{title}</p>
                        <p className="text-gray-200 text-sm">{description}</p>
                      </div>

                      <div className="bg-gradient-to-r from-[#7e95db] to-[#0e3b95] backdrop-blur-sm rounded-xl p-4 shadow-sm border border-blue-200/30">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {confirmedEmails.map((email) => (
                            <motion.div
                              key={email}
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className="bg-blue-100/90 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm"
                            >
                              <span className="text-[#0a3281]">{email}</span>
                              <button
                                onClick={() => handleEditEmail(email)}
                                className="text-[#0a3281] hover:text-blue-900"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleRemoveEmail(email)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X size={14} />
                              </button>
                            </motion.div>
                          ))}
                        </div>

                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-200" size={18} />
                          <input
                            type="email"
                            className="w-full pl-10 pr-4 py-2.5 bg-blue-100/20 rounded-lg border-none focus:ring-2 focus:ring-blue-300 text-white placeholder-gray-200"
                            placeholder="Add member email..."
                            value={currentEmail}
                            onChange={(e) => setCurrentEmail(e.target.value)}
                            onKeyDown={handleEmailKeyPress}
                          />
                        </div>
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
                        className="py-3 rounded-xl bg-gray-300 opacity-[0.90] hover:bg-gray-400 transition-colors text-[#0a3281] font-medium shadow-sm"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCreate}
                        className="py-3 rounded-xl opacity-[0.90] bg-green-500 hover:bg-green-600 transition-colors text-white font-semibold shadow-lg"
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
    </AnimatePresence>
  );
};

export default CreateGroupModal;