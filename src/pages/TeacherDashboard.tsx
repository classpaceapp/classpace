import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PodCard from '@/components/pods/PodCard';
import CreatePodModal from '@/components/pods/CreatePodModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, BookOpen, Activity, Sparkles } from 'lucide-react';

interface Pod {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  grade_level: string | null;
  created_at: string;
  updated_at: string;
  student_count?: number;
  last_activity?: string;
}

const TeacherDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchPods = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Fetch pods created by this teacher with student counts
      const { data: podsData, error } = await supabase
        .from('pods')
        .select(`
          *,
          pod_members!inner(count)
        `)
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform data to include student counts
      const podsWithCounts = await Promise.all(
        (podsData || []).map(async (pod) => {
          const { count } = await supabase
            .from('pod_members')
            .select('*', { count: 'exact', head: true })
            .eq('pod_id', pod.id)
            .eq('role', 'student');

          return {
            ...pod,
            student_count: count || 0
          };
        })
      );

      setPods(podsWithCounts);
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
    <DashboardLayout userRole="teacher">
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Welcome back, {user?.email?.split('@')[0]}!
                  </h1>
                  <p className="text-xl text-gray-600 mt-2">
                    Ready to inspire and educate? Here's what's happening in your classroom.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Total Pods</CardTitle>
                  <BookOpen className="h-8 w-8" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">{pods.length}</div>
                <p className="text-gray-600 font-medium">
                  {pods.length === 1 ? 'pod' : 'pods'} created
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Total Students</CardTitle>
                  <Users className="h-8 w-8" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {pods.reduce((total, pod) => total + (pod.student_count || 0), 0)}
                </div>
                <p className="text-gray-600 font-medium">across all pods</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Active This Week</CardTitle>
                  <Activity className="h-8 w-8" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {pods.filter(pod => {
                    const lastWeek = new Date();
                    lastWeek.setDate(lastWeek.getDate() - 7);
                    return pod.last_activity && new Date(pod.last_activity) > lastWeek;
                  }).length}
                </div>
                <p className="text-gray-600 font-medium">
                  {pods.filter(pod => {
                    const lastWeek = new Date();
                    lastWeek.setDate(lastWeek.getDate() - 7);
                    return pod.last_activity && new Date(pod.last_activity) > lastWeek;
                  }).length === 1 ? 'pod' : 'pods'} active
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pods Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                My Pods
              </h2>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl px-8 py-3 text-lg font-semibold shadow-xl"
              >
                <Plus className="mr-3 h-6 w-6" />
                Create Pod
              </Button>
            </div>

            {pods.length === 0 ? (
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-8">
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Create Your First Pod
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 max-w-md">
                    Pods are virtual classrooms where you can organize students, share materials, and conduct engaging learning sessions.
                  </p>
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl px-8 py-4 text-lg font-semibold shadow-xl"
                  >
                    <Plus className="mr-3 h-6 w-6" />
                    Create Your First Pod
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pods.map((pod) => (
                  <PodCard key={pod.id} pod={pod} userRole="teacher" basePath="/dashboard" />
                ))}
              </div>
            )}
          </div>

          <CreatePodModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            onPodCreated={fetchPods}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherDashboard;