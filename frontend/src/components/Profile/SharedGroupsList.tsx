import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SharedGroup } from '../types/types';

interface SharedGroupsListProps {
  groups: SharedGroup[];
}

const SharedGroupsList: React.FC<SharedGroupsListProps> = ({ groups }) => {
  const navigate = useNavigate();

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">No shared groups yet</p>
        <p className="text-slate-500 text-sm">
          You don't share any groups with this member
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <div
          key={group.id}
          onClick={() => navigate(`/group-details/${group.id}`)}
          className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 hover:shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer"
        >
          <h3 className="text-lg font-semibold text-white mb-2">{group.name}</h3>
          <p className="text-slate-400 text-sm mb-4">
            {group.description || 'No description'}
          </p>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{group.memberCount} members</span>
            <span>
              Joined {new Date(group.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SharedGroupsList;
