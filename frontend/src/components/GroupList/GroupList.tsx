import React, { useEffect, useState } from "react";
import GroupCard from "./GroupCard";
import { Group, Position } from "../types/types";
import GroupCursor from "./GroupCursor";

type GroupListProps = {
  groups: Group[];
  refreshGroups: () => void; // Add refresh function prop
};

const GroupList: React.FC<GroupListProps> = ({ groups }) => {
  const [position, setPosition] = useState<Position>({
    left: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  useEffect(() => {
    console.log("Groups updated:", groups);
  }, [groups]);

  return (
    <div className="p-4 relative z-1">
      {groups.length === 0 ? (
        <p>No Groups found. Join or Create one!</p>
      ) : (
        <div
          onMouseLeave={() => setPosition((prev) => ({ ...prev, opacity: 0 }))}
          className="relative grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4 z-1"
        >
          {groups.map((group) => (
            <GroupCard setPosition={setPosition} key={group.id} group={group} />
          ))}
          <GroupCursor position={position} />
        </div>
      )}
    </div>
  );
};

export default GroupList;
