import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const TimeOptimizer: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalPods: 0,
    quizzesCreated: 0,
    flashcardsCreated: 0,
    messagesSent: 0,
    estimatedHours: 0
  });

  useEffect(() => {
    if (user?.id) fetchMetrics();
  }, [user?.id]);

  const fetchMetrics = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);

      // Get teacher's pods count
      const { count: podCount } = await supabase
        .from('pods')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id);

      // Get quizzes created
      const { count: quizCount } = await supabase
        .from('pod_quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      // Get flashcards created
      const { count: flashcardCount } = await supabase
        .from('pod_flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      // Get messages sent (in teacher's pods)
      const { data: teacherPods } = await supabase
        .from('pods')
        .select('id')
        .eq('teacher_id', user.id);

      const podIds = teacherPods?.map(p => p.id) || [];
      
      const { count: messageCount } = await supabase
        .from('pod_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('pod_id', podIds);

      // Estimate weekly hours (rough calculation based on activities)
      const baseHoursPerPod = 3; // Base time per pod per week
      const minutesPerQuiz = 30;
      const minutesPerFlashcardSet = 15;
      const minutesPerMessage = 2;

      const totalMinutes = 
        (podCount || 0) * baseHoursPerPod * 60 +
        (quizCount || 0) * minutesPerQuiz +
        (flashcardCount || 0) * minutesPerFlashcardSet +
        (messageCount || 0) * minutesPerMessage;

      const estimatedWeeklyHours = Math.round(totalMinutes / 60);

      setMetrics({
        totalPods: podCount || 0,
        quizzesCreated: quizCount || 0,
        flashcardsCreated: flashcardCount || 0,
        messagesSent: messageCount || 0,
        estimatedHours: estimatedWeeklyHours
      });

    } catch (error) {
      console.error('Error fetching time metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const activityBreakdown = [
    { label: 'Pod Management', hours: Math.round(metrics.totalPods * 3 * 0.4), percentage: 40 },
    { label: 'Assessment Creation', hours: Math.round(metrics.quizzesCreated * 0.5), percentage: 25 },
    { label: 'Resource Development', hours: Math.round(metrics.flashcardsCreated * 0.25), percentage: 20 },
    { label: 'Student Communication', hours: Math.round(metrics.messagesSent * 0.033), percentage: 15 }
  ];

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white rounded-t-lg p-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Clock className="h-7 w-7" />
            Time Analytics & Insights
          </CardTitle>
          <CardDescription className="text-cyan-100 text-base">
            Platform-based analytics showing your teaching time investment
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estimated Weekly Hours</p>
                <p className="text-4xl font-bold text-cyan-700 mt-2">{metrics.estimatedHours}</p>
              </div>
              <Clock className="h-12 w-12 text-cyan-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Pods</p>
                <p className="text-4xl font-bold text-blue-700 mt-2">{metrics.totalPods}</p>
              </div>
              <Activity className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assessments Created</p>
                <p className="text-4xl font-bold text-indigo-700 mt-2">{metrics.quizzesCreated}</p>
              </div>
              <BarChart3 className="h-12 w-12 text-indigo-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resources Created</p>
                <p className="text-4xl font-bold text-purple-700 mt-2">{metrics.flashcardsCreated}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Breakdown */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Activity Time Breakdown
          </CardTitle>
          <CardDescription className="text-indigo-100">
            Estimated time allocation across platform activities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {activityBreakdown.map((activity, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{activity.label}</span>
                  <span className="text-sm font-bold text-indigo-700">
                    ~{activity.hours}h per week
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-full transition-all duration-500"
                    style={{ width: `${activity.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-cyan-50 border-2 border-cyan-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-cyan-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-cyan-900">Platform Analytics Note</p>
                <p className="text-sm text-cyan-700 mt-1">
                  These time estimates are calculated based on your platform activity including pod management, 
                  assessment creation, resource development, and student communication. Actual time may vary 
                  based on teaching style and student needs.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeOptimizer;