import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, BookOpen, Target, MessageSquare, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const TimeOptimizer: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [podCount, setPodCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const [{ data: pods }, { count: quizzes }, { count: flashcards }] = await Promise.all([
        supabase.from('pods').select('id').eq('teacher_id', user.id),
        supabase.from('pod_quizzes').select('*', { count: 'exact', head: true }).eq('created_by', user.id),
        supabase.from('pod_flashcards').select('*', { count: 'exact', head: true }).eq('created_by', user.id),
      ]);

      const podIds = pods?.map(p => p.id) || [];
      setPodCount(pods?.length || 0);
      setQuizCount(quizzes || 0);
      setFlashcardCount(flashcards || 0);

      if (podIds.length > 0) {
        const { count: messages } = await supabase.from('pod_messages').select('*', { count: 'exact', head: true }).in('pod_id', podIds);
        setMessageCount(messages || 0);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const estimateTime = () => {
    const podManagementTime = podCount * 2;
    const quizGradingTime = quizCount * 0.5;
    const contentCreationTime = flashcardCount * 0.1;
    const communicationTime = Math.min(messageCount * 0.05, 5);
    return {
      teaching: podManagementTime,
      grading: quizGradingTime,
      planning: contentCreationTime,
      communication: communicationTime,
      total: podManagementTime + quizGradingTime + contentCreationTime + communicationTime
    };
  };

  const timeData = estimateTime();
  const timeBreakdown = [
    { activity: 'Teaching & Pod Management', hours: Math.round(timeData.teaching), percentage: Math.round((timeData.teaching / timeData.total) * 100), color: 'bg-violet-500' },
    { activity: 'Grading & Assessment', hours: Math.round(timeData.grading), percentage: Math.round((timeData.grading / timeData.total) * 100), color: 'bg-blue-500' },
    { activity: 'Content Planning', hours: Math.round(timeData.planning), percentage: Math.round((timeData.planning / timeData.total) * 100), color: 'bg-green-500' },
    { activity: 'Communication', hours: Math.round(timeData.communication), percentage: Math.round((timeData.communication / timeData.total) * 100), color: 'bg-amber-500' }
  ];

  if (loading) return <Skeleton className="h-96" />;
  if (podCount === 0) return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardContent className="p-12 text-center">
        <Clock className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">No Activity Data Yet</h3>
        <p className="text-muted-foreground">Start creating pods to see time insights</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Clock className="h-5 w-5" />
            Estimated Weekly Time
          </CardTitle>
          <CardDescription className="text-violet-100">Based on your teaching activity</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-4 mb-6 bg-white/50 rounded-xl">
            <div className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">{Math.round(timeData.total)}</div>
            <p className="text-sm text-muted-foreground mt-2">Hours Per Week</p>
          </div>
          <div className="space-y-4">
            {timeBreakdown.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.activity}</span>
                  <span className="text-muted-foreground">{item.hours}h ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div className={`${item.color} h-3 rounded-full transition-all`} style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeOptimizer;