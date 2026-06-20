import React from 'react';
import GroupList from '../components/GroupList/GroupList';
import Activities from '../components/Activities/Activities';
import Footer from '../components/Footer/Footer';

import { useGroups } from '../context/GroupContext';

const HomePage: React.FC = () => {
  const {groups, refreshGroups} = useGroups();

  return (
    <div className='min-h-screen bg-slate-900/50 overflow-y-auto flex flex-col'>
      <div className='flex justify-center py-12 flex-1'>
        <div className="w-full max-w-6xl px-4">
          {/* Page Title - Clear Visual Hierarchy */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-slate-50 mb-2">
              My Chores
            </h1>
            <p className="text-slate-400">
              Manage your tasks and collaborate with your team
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Groups section - takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <GroupList groups={groups} refreshGroups={refreshGroups} />
            </div>

            {/* Activities section - takes 1 column on large screens */}
            <div className="lg:col-span-1">
              <Activities />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
