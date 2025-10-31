import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PodChat } from '@/components/pods/PodChat';
import { PodNotes } from '@/components/pods/PodNotes';
import { PodMaterials } from '@/components/pods/PodMaterials';
import { PodMeetings } from '@/components/pods/PodMeetings';
import { PodQuizzes } from '@/components/pods/PodQuizzes';
import { WhiteboardTab } from '@/components/pods/WhiteboardTab';
import { 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  FileText, 
  Upload, 
  Palette,
  Video,
  BookOpen
} from 'lucide-react';

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
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

const StudentPodView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pod, setPod] = useState<Pod | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [leaving, setLeaving] = useState(false);

  const handleLeavePod = async () => {
    if (!user?.id || !id) return;

    setLeaving(true);
    try {
      const { error } = await supabase
        .from('pod_members')
        .delete()
        .eq('pod_id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Left pod successfully',
        description: 'You are no longer a member of this pod',
      });

      navigate('/student-dashboard');
    } catch (error: any) {
      toast({
        title: 'Failed to leave pod',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLeaving(false);
    }
  };

  const fetchPod = async () => {
    if (!id || !user?.id) return;

    try {
      setLoading(true);
      
      // Check if user is a member of this pod
      const { data: membership, error: memberError } = await supabase
        .from('pod_members')
        .select('*')
        .eq('pod_id', id)
        .eq('user_id', user.id)
        .single();

      if (memberError || !membership) {
        toast({
          title: "Access denied",
          description: "You don't have permission to view this pod.",
          variant: "destructive",
        });
        navigate('/student-dashboard');
        return;
      }

      // Fetch pod details (without relationship hints)
      const { data: podData, error: podError } = await supabase
        .from('pods')
        .select('*')
        .eq('id', id)
        .single();

      if (podError) throw podError;

      // Fetch teacher profile separately to avoid schema join dependency
      let teacherProfile: { first_name: string | null; last_name: string | null } | null = null;
      if (podData?.teacher_id) {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', podData.teacher_id)
          .maybeSingle();
        if (!profErr) teacherProfile = prof;
      }

      const transformedPod = {
        ...podData,
        profiles: teacherProfile || undefined,
      } as Pod;

      setPod(transformedPod);
    } catch (error: any) {
      console.error('Error fetching pod:', error);
      toast({
        title: "Failed to load pod",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      navigate('/student-dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPod();
  }, [id, user?.id]);

  if (loading) {
    return (
      <DashboardLayout userRole="learner">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-muted rounded w-1/2"></div>
          </div>
          <div className="h-64 bg-muted rounded animate-pulse"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!pod) {
    return (
      <DashboardLayout userRole="learner">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-muted-foreground">Pod not found</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="learner">
      <div className="container mx-auto px-4 py-8 mt-6">
        <div className="space-y-6 pl-8">
        {/* Header - Enhanced Styling */}
        <div className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/student-dashboard')}
            className="shrink-0 border-2 border-indigo-500/50 hover:bg-indigo-500 hover:text-white hover:scale-110 transition-all duration-300 shadow-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
              {pod.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground font-medium">
              {pod.profiles && (
                <>
                  <span>Teacher: {pod.profiles.first_name} {pod.profiles.last_name}</span>
                  <span>•</span>
                </>
              )}
              <span className="px-3 py-1 bg-indigo-500 text-white text-sm font-semibold rounded-full shadow-sm">
                {pod.subject}
              </span>
            </div>
            {pod.description && (
              <p className="text-muted-foreground mt-2 text-lg font-medium">{pod.description}</p>
            )}
          </div>
        </div>

        {/* Pod Navigation Tabs - Enhanced Styling */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 lg:w-fit lg:grid-cols-7 h-auto p-2 gap-2 bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 rounded-2xl shadow-2xl border-2 border-white/10">
            <TabsTrigger 
              value="overview" 
              className="gap-2 h-14 rounded-xl data-[state=active]:font-bold data-[state=active]:scale-105 data-[state=active]:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:bg-white/10 transition-all duration-300 data-[state=active]:border-2 data-[state=active]:border-blue-300"
            >
              <Users className="h-5 w-5" />
              <span className="hidden sm:inline font-semibold">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="gap-2 h-14 rounded-xl data-[state=active]:font-bold data-[state=active]:scale-105 data-[state=active]:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:bg-white/10 transition-all duration-300 data-[state=active]:border-2 data-[state=active]:border-green-300"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="hidden sm:inline font-semibold">Chat</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="gap-2 h-14 rounded-xl data-[state=active]:font-bold data-[state=active]:scale-105 data-[state=active]:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:bg-white/10 transition-all duration-300 data-[state=active]:border-2 data-[state=active]:border-amber-300"
            >
              <FileText className="h-5 w-5" />
              <span className="hidden sm:inline font-semibold">Notes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="meetings" 
              className="gap-2 h-14 rounded-xl data-[state=active]:font-bold data-[state=active]:scale-105 data-[state=active]:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:bg-white/10 transition-all duration-300 data-[state=active]:border-2 data-[state=active]:border-teal-300"
            >
              <Video className="h-5 w-5" />
              <span className="hidden sm:inline font-semibold">Meetings</span>
            </TabsTrigger>
            <TabsTrigger 
              value="materials" 
              className="gap-2 h-14 rounded-xl data-[state=active]:font-bold data-[state=active]:scale-105 data-[state=active]:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:bg-white/10 transition-all duration-300 data-[state=active]:border-2 data-[state=active]:border-purple-300"
            >
              <Upload className="h-5 w-5" />
              <span className="hidden sm:inline font-semibold">Materials</span>
            </TabsTrigger>
            <TabsTrigger 
              value="quizzes" 
              className="gap-2 h-14 rounded-xl data-[state=active]:font-bold data-[state=active]:scale-105 data-[state=active]:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:bg-white/10 transition-all duration-300 data-[state=active]:border-2 data-[state=active]:border-indigo-300"
            >
              <BookOpen className="h-5 w-5" />
              <span className="hidden sm:inline font-semibold">Quizzes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="whiteboard" 
              className="gap-2 h-14 rounded-xl data-[state=active]:font-bold data-[state=active]:scale-105 data-[state=active]:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:bg-white/10 transition-all duration-300 data-[state=active]:border-2 data-[state=active]:border-pink-300"
            >
              <Palette className="h-5 w-5" />
              <span className="hidden sm:inline font-semibold">Whiteboard</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card className="border-2 border-blue-500/30 shadow-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-blue-500/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Pod Information</CardTitle>
                  <Button 
                    variant="outline"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={handleLeavePod}
                    disabled={leaving}
                  >
                    {leaving ? 'Leaving...' : 'Leave Pod'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Title</label>
                    <p className="font-medium text-lg">{pod.title}</p>
                  </div>
                  {pod.description && (
                    <div>
                      <label className="text-sm text-muted-foreground">Description</label>
                      <p className="font-medium">{pod.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-muted-foreground">Subject</label>
                    <p className="font-medium">{pod.subject}</p>
                  </div>
                  {pod.profiles && (
                    <div>
                      <label className="text-sm text-muted-foreground">Teacher</label>
                      <p className="font-medium">
                        {pod.profiles.first_name} {pod.profiles.last_name}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <PodChat podId={id!} />
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <PodNotes podId={id!} isTeacher={false} />
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <PodMeetings podId={id!} />
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            <PodMaterials podId={id!} isTeacher={false} />
          </TabsContent>

          <TabsContent value="quizzes" className="mt-6">
            <PodQuizzes podId={id!} isTeacher={false} />
          </TabsContent>

          <TabsContent value="whiteboard" className="mt-6">
            <WhiteboardTab podId={id!} isTeacher={false} />
          </TabsContent>

        </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentPodView;