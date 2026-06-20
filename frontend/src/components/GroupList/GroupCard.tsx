import React, { Dispatch, SetStateAction, useRef } from "react";
import { Group, Position } from "../types/types";
import { motion } from "framer-motion";
import { FiUsers, FiCalendar, FiChevronRight } from "react-icons/fi";
import {useNavigate} from "react-router-dom";
type GroupCardProps = {
  group: Group;
  setPosition: Dispatch<SetStateAction<Position>>;
};

const GroupCard: React.FC<GroupCardProps> = ({ group, setPosition }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const handleCardClick = (groupId: number) => {
    navigate(`/group-details/${groupId}`);
  }
  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return;
        const { width, height, left, top } = ref.current.getBoundingClientRect();
        const parent = ref.current.offsetParent as HTMLElement;
        const parentLeft = parent?.getBoundingClientRect().left || 0;
        const parentTop = parent?.getBoundingClientRect().top

        setPosition({
          top: top - parentTop,
          left: left - parentLeft,
          width,
          height,
          opacity: 1,
        });
      }}
      initial={{ scale: 1, opacity: 0, y: 20 }}
      whileInView={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: "0px 20px 40px rgba(59, 130, 246, 0.2)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="w-full z-0 rounded-2xl relative overflow-hidden group bg-slate-800 cursor-pointer shadow-lg hover:shadow-xl transition-shadow border border-slate-700 border-t-2 border-t-cyan-500"
      onClick={() => {handleCardClick(group.id)}}
    >
      {/* Gradient Header */}
      <div className="h-24 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700"></div>

      {/* Card Content */}
      <div className="relative px-6 pb-5">
        {/* Icon overlapping header */}
        <div className="flex items-start justify-between -mt-12 mb-4">
          <div className="bg-cyan-600/20 rounded-lg p-3 shadow-md">
            <FiUsers className="w-6 h-6 text-cyan-400" />
          </div>
          <motion.div
            whileHover={{ x: 4 }}
            className="text-gray-500 group-hover:text-cyan-400 transition-colors mt-1"
          >
            <FiChevronRight className="w-6 h-6" />
          </motion.div>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: '1fr 250px' }}>
          {/* Left Column - Group Info */}
          <div>
            <h3 className="text-lg font-bold text-white mb-2">
              {group.name}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2 relative">
              {group.description || "No description provided"}
              <span className="absolute bottom-0 right-0 bg-gradient-to-l from-slate-800 to-transparent w-8 h-5"></span>
            </p>
          </div>

          {/* Right Column - Date and Members */}
          <div className="bg-slate-700/50 rounded-lg p-3.5 border border-slate-600 shadow-sm flex flex-col items-start justify-start h-fit">
            {/* Date Section */}
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1.5">
              <FiCalendar className="w-5.5 h-5.5 text-cyan-400 flex-shrink-0" />
              <span className="text-xs">{new Date(group.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Members Section with Badge */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="flex items-center gap-0.5 bg-cyan-600/20 px-1.5 py-0.5 rounded text-xs">
                <FiUsers className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-cyan-300 text-xs">{group.members.length}</span>
              </div>
              <span className="text-xs text-gray-400">
                {group.members.length === 1 ? 'member' : 'members'}
              </span>
            </div>

            {/* Member Avatars */}
            {group.members.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-start">
                {group.members.map((member, index) => (
                  <div key={index} className="relative inline-block group/member">
                    <img
                      src={member.user?.profilePictureUrl || "/default-avatar.jpeg"}
                      alt={`${member.user?.firstName} ${member.user?.lastName}`}
                      className="w-10 h-10 rounded-full object-cover border-1.5 border-slate-700 shadow-sm cursor-pointer hover:border-cyan-400 transition-all hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (member.user?.id) {
                          navigate(`/member/${member.user.id}`);
                        }
                      }}
                    />
                    {/* Hover tooltip - individual user details */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover/member:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg border border-slate-700">
                      <div className="font-semibold whitespace-nowrap">{member.user?.firstName} {member.user?.lastName}</div>
                      <div className="text-gray-300 text-xs whitespace-nowrap">@{member.user?.userName}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-amber-400">No members</div>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-cyan-600 text-white py-2.5 rounded-lg font-semibold hover:bg-cyan-500 transition-all shadow-md hover:shadow-lg hover:shadow-cyan-500/50 flex items-center justify-center gap-2 text-sm"
          onClick={() => {handleCardClick(group.id)}}
        >
          View Group Details
          <FiChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default GroupCard;
