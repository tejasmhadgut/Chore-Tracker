import React from 'react';
import ProfileDetail from '../components/Profile/ProfileDetails';
import Footer from '../components/Footer/Footer';

const ProfilePage: React.FC = () => {
  return (
    <div className='min-h-screen bg-slate-900/50 flex flex-col'>
      <div className='flex-1'>
        <ProfileDetail />
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;