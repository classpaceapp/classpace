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
        <div className="text-center space-y-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-secondary/20 rounded-3xl blur-3xl -z-10" />
          <div className="relative bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent animate-gradient-shift">
              Welcome back, {profile?.first_name || 'Teacher'}! 
              <Sparkles className="inline-block w-10 h-10 ml-3 text-primary animate-pulse" />
            </h1>
            <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
              Ready to inspire and engage your students today? Let's create amazing learning experiences together.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-primary/30 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-transparent opacity-50" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground">Total Pods</CardTitle>
              <div className="p-2 bg-primary/20 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-primary mb-1">{pods.length}</div>
              <p className="text-sm text-primary/80">
                Active learning spaces
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-purple-500/5 border-purple-500/30 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-transparent to-transparent opacity-50" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Students</CardTitle>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="h-6 w-6 text-purple-500 animate-bounce" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{totalStudents}</div>
              <p className="text-sm text-purple-600/80 dark:text-purple-400/80">
                Across all your pods
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-secondary/20 via-secondary/10 to-secondary/5 border-secondary/30 shadow-lg shadow-secondary/10 hover:shadow-xl hover:shadow-secondary/20 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-transparent to-transparent opacity-50" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-secondary-foreground">This Week</CardTitle>
              <div className="p-2 bg-secondary/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-secondary animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-secondary mb-1">
                {pods.filter(pod => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(pod.updated_at) > weekAgo;
                }).length}
              </div>
              <p className="text-sm text-secondary/80">
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
            <Card className="relative overflow-hidden border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-purple-500/5 to-secondary/5">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-50" />
              <CardHeader className="relative text-center space-y-6 py-16">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-3">
                  <CardTitle className="text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Create Your First Pod
                  </CardTitle>
                  <CardDescription className="text-lg max-w-md mx-auto text-muted-foreground">
                    Get started by creating a learning space where you can share materials, 
                    chat with students, and track progress.
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setCreateModalOpen(true)} 
                  size="lg" 
                  className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                >
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