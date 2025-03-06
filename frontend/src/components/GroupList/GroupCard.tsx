import React, { Dispatch, SetStateAction, useRef } from "react";
import { Group, Position } from "../types/types";
import { motion } from "framer-motion";
import {  FiUsers } from "react-icons/fi";
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
        const { width, height, left } = ref.current.getBoundingClientRect();
        const parent = ref.current.offsetParent as HTMLElement;
        const parentLeft = parent?.getBoundingClientRect().left || 0;

        setPosition({
          left: left - parentLeft,
          width,
          height,
          opacity: 1,
        });
      }}
      initial={{ scale: 1 }}
      whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)" }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="w-full p-4 shadow-xl z-0 rounded-2xl border-[2px] border-slate-300 relative overflow-hidden group bg-white cursor-pointer"
      onClick={() => {handleCardClick(group.id)}} // Action on click
    >
      {/* Background Hover Animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#3253b4] to-[#0a3281] translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-400"
      />

      {/* Visual Hover Icon */}
      

      {/* Content */}

      <motion.div
        className="absolute  -top-0 -right-0 opacity-0 group-hover:opacity-50 transition-opacity duration-400 delay-150" // Adjust delay to match animation timing
      >
        <FiUsers className="text-9xl text-slate-100 group-hover:text-[#00bbd4d2] group-hover:rotate-12 transition-transform duration-1000" />
      </motion.div>
      <div className="relative  p-2">
        <h3 className="flex items-center font-medium text-lg text-[#333333] group-hover:text-gray-200 duration-450">
          {group.name} <FiUsers 
        className="ml-2 group-hover:text-gray-200 transition-all duration-300"
        style={{ fill: "#3253b4" }} // Set the default color before hover
        />
        </h3>
        <p className="text-[#333333] group-hover:text-gray-200 duration-450">
          {group.description}
        </p>
        <p className="text-[#333333] group-hover:text-gray-200 duration-450">
          Created At: {new Date(group.createdAt).toLocaleDateString()}
        </p>
        <p className="text-[#333333] group-hover:text-gray-200 duration-450">Members:</p>
        <ul>
          {group.memberNames.map((name, index) => (
            <li key={index} className="text-[#333333] group-hover:text-gray-200 duration-450">
              {name}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default GroupCard;
