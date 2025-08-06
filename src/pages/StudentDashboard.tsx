import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PodCard from '@/components/pods/PodCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, BookOpen, MessageSquare, Sparkles } from 'lucide-react';

interface Pod {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  grade_level: string | null;
  created_at: string;
  updated_at: string;
  teacher_name?: string;
  student_count?: number;
  last_activity?: string;
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
            id,
            name,
            description,
            subject,
            grade_level,
            created_at,
            updated_at,
            created_by,
            profiles!pods_created_by_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('role', 'student');

      if (error) throw error;

      // Transform data and get student counts
      const podsWithDetails = await Promise.all(
        (memberPods || []).map(async (member) => {
          const pod = member.pods;
          if (!pod) return null;

          const { count } = await supabase
            .from('pod_members')
            .select('*', { count: 'exact', head: true })
            .eq('pod_id', pod.id)
            .eq('role', 'student');

          const teacher = pod.profiles;
          
          return {
            id: pod.id,
            name: pod.name,
            description: pod.description,
            subject: pod.subject,
            grade_level: pod.grade_level,
            created_at: pod.created_at,
            updated_at: pod.updated_at,
            teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher',
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

  const totalClasses = pods.length;
  const totalClassmates = pods.reduce((sum, pod) => sum + (pod.student_count || 0), 0);

  if (loading) {
    return (
      <DashboardLayout userRole="learner">
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
    <DashboardLayout userRole="learner">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Welcome back, {profile?.first_name || 'Student'}! 
            <Sparkles className="inline-block w-8 h-8 ml-2 text-primary" />
          </h1>
          <p className="text-lg text-muted-foreground">
            Ready to continue your learning journey today?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalClasses}</div>
              <p className="text-xs text-muted-foreground">
                Active learning pods
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classmates</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{totalClassmates}</div>
              <p className="text-xs text-muted-foreground">
                Fellow students
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <MessageSquare className="h-4 w-4 text-accent" />
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
                Active classes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pods Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Your Classes</h2>
            <p className="text-muted-foreground">
              Access your course materials, chat with classmates, and stay up to date
            </p>
          </div>

          {pods.length === 0 ? (
            <Card className="border-dashed border-2 border-border/50">
              <CardHeader className="text-center space-y-4 py-12">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">No Classes Yet</CardTitle>
                  <CardDescription className="text-base max-w-md mx-auto">
                    You haven't been added to any classes yet. Your teachers will invite you 
                    to join their learning pods when classes begin.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pods.map((pod) => (
                <PodCard 
                  key={pod.id} 
                  pod={pod} 
                  userRole="learner"
                  basePath="/student-dashboard"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;