import React from 'react'; // API call to join group
import { Group } from '../types/types';
import { handleJoin } from '../../services/GroupService';

type InvitationCardProps = {
    group: Group;
};

const InvitationCard: React.FC<InvitationCardProps> = ({ group }) => {
    const handleAccept = async () => {
        try {
            await handleJoin(group.id);
            alert("You have joined the group successfully!");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Error joining group");
        }
    };

    return (
        <div className="mt-4 p-4 border rounded-lg shadow-lg bg-white">
            <h3 className="text-lg font-semibold">You're Invited to Join</h3>
            <h2 className="text-xl font-bold">{group.name}</h2>
            <p className="text-gray-500">{group.description}</p>
            <p className="text-gray-400 text-sm">Created At: {new Date(group.createdAt).toLocaleDateString()}</p>
            <p className="text-[#333333] group-hover:text-gray-200 duration-450">Members:</p>
            <ul>
                {group.memberNames.map((name, index) => (
                <li key={index} className="text-[#333333] group-hover:text-gray-200 duration-450">
                {name}
                </li>
            ))}
            </ul>
            <button 
                onClick={handleAccept} 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
                Accept Invitation
            </button>
        </div>
    );
};

export default InvitationCard;
