import React, { useEffect, useState } from "react";
import GroupCard from "./GroupCard";
import { Group, Position } from "../types/types";
import GroupCursor from "./GroupCursor";
import { motion } from "framer-motion";
import { Users, Plus } from "lucide-react";
import { PrimaryButton } from "../Button";

type GroupListProps = {
  groups: Group[];
  refreshGroups: () => void; // Add refresh function prop
};

const GroupList: React.FC<GroupListProps> = ({ groups }) => {
  const [position, setPosition] = useState<Position>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  useEffect(() => {
    console.log("Groups updated:", groups);
  }, [groups]);

  return (
    <motion.div className="w-full">
      {groups.length === 0 ? (
        <div className="bg-slate-800/50 rounded-2xl p-16 text-center border border-slate-700">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-slate-700/50 rounded-full">
              <Users className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">No Groups Yet</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">You haven't joined any groups yet. Start by creating a new group or joining an existing one with an invite code.</p>
          <PrimaryButton icon={<Plus className="w-5 h-5" />}>
            Create Group
          </PrimaryButton>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="relative grid grid-cols-1 gap-6 max-w-2xl w-full">
            {groups.map((group) => (
              <GroupCard setPosition={setPosition} key={group.id} group={group} />
            ))}
            <GroupCursor position={position} />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GroupList;
