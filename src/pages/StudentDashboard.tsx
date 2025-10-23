import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PodCard from '@/components/pods/PodCard';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Users, BookOpen, Calendar, Sparkles } from 'lucide-react';

interface Pod {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  teacher_id: string;
  pod_code: string;
  created_at: string;
  updated_at: string;
  teacher_name?: string;
  student_count?: number;
}

const StudentDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPods = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Fetch pods where the student is a member
      const { data: memberPods, error } = await supabase
        .from('pod_members')
        .select(`
          pod_id,
          pods (
            *
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Transform data and get student counts
      const podsWithDetails = await Promise.all(
        (memberPods || []).map(async (member: any) => {
          const pod = member.pods;
          if (!pod) return null;

          const { count } = await supabase
            .from('pod_members')
            .select('*', { count: 'exact', head: true })
            .eq('pod_id', pod.id);

          // Get teacher info
          const { data: teacherProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', pod.teacher_id)
            .single();
          
          return {
            ...pod,
            teacher_name: teacherProfile 
              ? `${teacherProfile.first_name} ${teacherProfile.last_name}` 
              : 'Unknown Teacher',
            student_count: count || 0
          };
        })
      );

      setPods(podsWithDetails.filter(Boolean) as Pod[]);
    } catch (error: any) {
      console.error('Error fetching pods:', error);
      toast({
        title: "Failed to load pods",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPods();
  }, [user?.id]);

  return (
    <DashboardLayout userRole="learner">
      {loading ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
          <div className="mb-8">
            <Skeleton className="h-12 w-80 mb-4 rounded-2xl" />
            <Skeleton className="h-6 w-96 rounded-xl" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-3xl" />
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
          {/* Welcome Section */}
          <div className="mb-12">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Welcome back, {user?.email?.split('@')[0]}!
                  </h1>
                  <p className="text-xl text-gray-600 mt-2">
                    Ready to learn something amazing today? Here's your learning overview.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats and Subscription Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Total Classes</CardTitle>
                  <BookOpen className="h-8 w-8" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">{pods.length}</div>
                <p className="text-gray-600 font-medium">
                  {pods.length === 1 ? 'class' : 'classes'} enrolled
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Total Classmates</CardTitle>
                  <Users className="h-8 w-8" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {pods.reduce((total, pod) => total + (pod.student_count || 0), 0) - pods.length}
                </div>
                <p className="text-gray-600 font-medium">across all classes</p>
              </CardContent>
            </Card>

              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Active This Week</CardTitle>
                    <Calendar className="h-8 w-8" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {pods.length}
                  </div>
                  <p className="text-gray-600 font-medium">
                    classes active
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Card */}
            <div>
              <SubscriptionCard />
            </div>
          </div>

          {/* Classes Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                My Classes
              </h2>
            </div>

            {pods.length === 0 ? (
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-8">
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    No Classes Yet
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 max-w-md">
                    You haven't been enrolled in any classes yet. Contact your teacher to get started with your learning journey.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pods.map((pod) => (
                  <PodCard key={pod.id} pod={pod} userRole="learner" basePath="/student-dashboard" />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;