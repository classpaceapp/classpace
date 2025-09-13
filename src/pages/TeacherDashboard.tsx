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
        <div className="border-b border-border pb-8">
          <div className="bg-card border border-border rounded-lg p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Welcome back, {profile?.first_name || 'Teacher'}!
              <Sparkles className="inline-block w-8 h-8 ml-3 text-primary" />
            </h1>
            <p className="text-xl text-muted-foreground mt-4">
              Ready to inspire and engage your students today? Let's create amazing learning experiences together.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-2 border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-foreground">Total Pods</CardTitle>
              <div className="p-2 bg-primary rounded-lg">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground mb-1">{pods.length}</div>
              <p className="text-sm font-medium text-muted-foreground">
                Active learning spaces
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-foreground">Total Students</CardTitle>
              <div className="p-2 bg-secondary rounded-lg">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground mb-1">{totalStudents}</div>
              <p className="text-sm font-medium text-muted-foreground">
                Across all your pods
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-foreground">This Week</CardTitle>
              <div className="p-2 bg-accent rounded-lg">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground mb-1">
                {pods.filter(pod => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(pod.updated_at) > weekAgo;
                }).length}
              </div>
              <p className="text-sm font-medium text-muted-foreground">
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
            <Card className="border-2 border-dashed border-primary bg-card">
              <CardHeader className="text-center space-y-6 py-16">
                <div className="mx-auto w-20 h-20 bg-primary rounded-lg flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="space-y-3">
                  <CardTitle className="text-2xl font-bold text-foreground">
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
                  className="gap-2"
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