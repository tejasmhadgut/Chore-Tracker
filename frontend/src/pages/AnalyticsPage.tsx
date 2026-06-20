import React from 'react';
import { useParams } from 'react-router-dom';
import AnalyticsDashboard from '../components/Analytics/AnalyticsDashboard';
import Footer from '../components/Footer/Footer';

const AnalyticsPage: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();

    return (
      <div className='min-h-screen bg-slate-900/50 flex flex-col'>
        <div className='flex-1'>
          <AnalyticsDashboard groupId={groupId ? parseInt(groupId) : undefined} />
        </div>
        <Footer />
      </div>
    );
};

export default AnalyticsPage;
