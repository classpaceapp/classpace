import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PodCard from '@/components/pods/PodCard';
import CreatePodModal from '@/components/pods/CreatePodModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, BookOpen, TrendingUp, Sparkles } from 'lucide-react';

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

  const totalStudents = pods.reduce((sum, pod) => sum + (pod.student_count || 0), 0);

  if (loading) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Welcome back, {profile?.first_name || 'Teacher'}! 
            <Sparkles className="inline-block w-8 h-8 ml-2 text-primary" />
          </h1>
          <p className="text-lg text-muted-foreground">
            Ready to inspire and engage your students today?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pods</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{pods.length}</div>
              <p className="text-xs text-muted-foreground">
                Active learning spaces
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Across all your pods
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {pods.filter(pod => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(pod.updated_at) > weekAgo;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Active pods
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pods Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Your Pods</h2>
              <p className="text-muted-foreground">
                Manage your learning spaces and engage with students
              </p>
            </div>
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Pod
            </Button>
          </div>

          {pods.length === 0 ? (
            <Card className="border-dashed border-2 border-border/50">
              <CardHeader className="text-center space-y-4 py-12">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">Create Your First Pod</CardTitle>
                  <CardDescription className="text-base max-w-md mx-auto">
                    Get started by creating a learning space where you can share materials, 
                    chat with students, and track progress.
                  </CardDescription>
                </div>
                <Button onClick={() => setCreateModalOpen(true)} size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Create Your First Pod
                </Button>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pods.map((pod) => (
                <PodCard 
                  key={pod.id} 
                  pod={pod} 
                  userRole="teacher"
                  basePath="/dashboard"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreatePodModal 
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onPodCreated={fetchPods}
      />
    </DashboardLayout>
  );
};

export default TeacherDashboard;