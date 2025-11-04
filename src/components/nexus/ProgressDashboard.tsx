import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Target, BookOpen, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const ProgressDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPods, setTotalPods] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [totalFlashcards, setTotalFlashcards] = useState(0);
  const [podMetrics, setPodMetrics] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) fetchMetrics();
  }, [user?.id]);

  const fetchMetrics = async () => {
    if (!user?.id) return;
    try {
      const { data: pods } = await supabase.from('pods').select('id, title, subject').eq('teacher_id', user.id);
      const podIds = pods?.map(p => p.id) || [];
      setTotalPods(pods?.length || 0);

      if (podIds.length === 0) { setLoading(false); return; }

      const podMetricsData = await Promise.all(pods.map(async (pod) => {
        const [{ count: studentCount }, { count: quizCount }, { count: flashcardCount }, { count: messageCount }] = await Promise.all([
          supabase.from('pod_members').select('*', { count: 'exact', head: true }).eq('pod_id', pod.id),
          supabase.from('pod_quizzes').select('*', { count: 'exact', head: true }).eq('pod_id', pod.id),
          supabase.from('pod_flashcards').select('*', { count: 'exact', head: true }).eq('pod_id', pod.id),
          supabase.from('pod_messages').select('*', { count: 'exact', head: true }).eq('pod_id', pod.id)
        ]);
        return { id: pod.id, title: pod.title, subject: pod.subject, studentCount: studentCount || 0, quizCount: quizCount || 0, flashcardCount: flashcardCount || 0, messageCount: messageCount || 0 };
      }));

      setPodMetrics(podMetricsData);
      setTotalStudents(podMetricsData.reduce((sum, pod) => sum + pod.studentCount, 0));
      setTotalQuizzes(podMetricsData.reduce((sum, pod) => sum + pod.quizCount, 0));
      setTotalFlashcards(podMetricsData.reduce((sum, pod) => sum + pod.flashcardCount, 0));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Skeleton className="h-96" />;
  if (totalPods === 0) return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardContent className="p-12 text-center">
        <BookOpen className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">No Pods Yet</h3>
        <p className="text-muted-foreground">Create your first pod to start tracking progress</p>
      </CardContent>
    </Card>
  );

  const stats = [
    { label: 'Total Pods', value: totalPods, icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Quizzes Created', value: totalQuizzes, icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { label: 'Flashcard Sets', value: totalFlashcards, icon: MessageSquare, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="border-2 hover:shadow-xl transition-all">
              <CardHeader className={`${stat.bgColor} pb-3`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <BarChart3 className="h-6 w-6" />
            Pod Performance Analytics
          </CardTitle>
          <CardDescription className="text-violet-100">Real-time insights across all your pods</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {podMetrics.map((pod) => (
              <Card key={pod.id} className="border-2 border-violet-100 hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{pod.title}</CardTitle>
                  <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white">{pod.subject}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-blue-600">{pod.studentCount}</div>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-xl">
                      <Target className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-purple-600">{pod.quizCount}</div>
                      <p className="text-xs text-muted-foreground">Quizzes</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-xl">
                      <BookOpen className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-green-600">{pod.flashcardCount}</div>
                      <p className="text-xs text-muted-foreground">Flashcards</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-xl">
                      <MessageSquare className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-amber-600">{pod.messageCount}</div>
                      <p className="text-xs text-muted-foreground">Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressDashboard;