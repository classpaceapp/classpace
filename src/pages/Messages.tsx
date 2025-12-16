import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TeacherInbox } from '@/components/messaging/TeacherInbox';
import { LearnerSentMessages } from '@/components/messaging/LearnerSentMessages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, Inbox } from 'lucide-react';

const Messages: React.FC = () => {
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'teacher';

  return (
    <DashboardLayout userRole={isTeacher ? 'teacher' : 'learner'}>
      <div className="container mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="space-y-6 md:pl-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Messages
              </h1>
              <p className="text-sm text-muted-foreground">
                {isTeacher ? 'View and respond to student inquiries' : 'Track your conversations with educators'}
              </p>
            </div>
          </div>

          {/* Content */}
          {isTeacher ? (
            <Card className="border-2 border-teal-500/30 shadow-xl bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20">
              <CardHeader className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-b border-teal-500/20">
                <CardTitle className="flex items-center gap-2 text-teal-900 dark:text-teal-100">
                  <Inbox className="h-5 w-5 text-teal-600" />
                  Student Inbox
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <TeacherInbox />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-teal-500/30 shadow-xl bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20">
              <CardHeader className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-b border-teal-500/20">
                <CardTitle className="flex items-center gap-2 text-teal-900 dark:text-teal-100">
                  <Send className="h-5 w-5 text-teal-600" />
                  Sent Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <LearnerSentMessages />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
