import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SupportTab } from '@/components/dashboard/SupportTab';

const SupportPage: React.FC = () => {
  const { profile } = useAuth();
  const userRole = profile?.role === 'teacher' ? 'teacher' : 'learner';

  return (
    <DashboardLayout userRole={userRole}>
      <SupportTab />
    </DashboardLayout>
  );
};

export default SupportPage;
