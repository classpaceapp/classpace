import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MyPlanTab } from '@/components/dashboard/MyPlanTab';

const MyPlan: React.FC = () => {
  const { profile } = useAuth();
  const userRole = profile?.role === 'teacher' ? 'teacher' : 'learner';

  return (
    <DashboardLayout userRole={userRole}>
      <MyPlanTab />
    </DashboardLayout>
  );
};

export default MyPlan;
