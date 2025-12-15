import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import SmartAssistant from '@/components/assistant/SmartAssistant';

const AIChat = () => {
  const { profile } = useAuth();
  const userRole = profile?.role === 'teacher' ? 'teacher' : 'learner';

  return (
    <DashboardLayout userRole={userRole}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <SmartAssistant userRole={userRole} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIChat;
