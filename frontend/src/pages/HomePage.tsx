import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar/Navbar';
import GroupList from '../components/GroupList/GroupList';
import { getGroupList } from '../services/GroupService';
import { Group } from '../components/types/types';

const HomePage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);

  const fetchGroups = async () => {
    try {
      const data = await getGroupList();
      setGroups(data);
    } catch (error) {
      console.error("Failed to fetch groups", error);
    }
  };

  useEffect(() => {
    fetchGroups(); // Fetch groups when HomePage mounts
  }, []);

  return (
    <div className='min-h-screen bg-white'>
      <Navbar refreshGroups={fetchGroups} />
      <div className='flex justify-center py-5'>
        <div className="w-full max-w-xl px-4">
          <GroupList groups={groups} refreshGroups={fetchGroups} />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
