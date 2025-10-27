import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FAQsTab } from '@/components/dashboard/FAQsTab';

const FAQs: React.FC = () => {
  const { profile } = useAuth();
  const userRole = profile?.role === 'teacher' ? 'teacher' : 'learner';

  return (
    <DashboardLayout userRole={userRole}>
      <FAQsTab />
    </DashboardLayout>
  );
};

export default FAQs;
