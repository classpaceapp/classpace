import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ResourceCenterFull from '@/components/nexus/ResourceCenterFull';

const AllResources: React.FC = () => {
  return (
    <DashboardLayout userRole="learner">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 md:p-8">
        <ResourceCenterFull />
      </div>
    </DashboardLayout>
  );
};

export default AllResources;
