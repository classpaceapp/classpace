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
import { PodStickyNotes } from '@/components/pods/PodStickyNotes';
import { PodMaterials } from '@/components/pods/PodMaterials';
import PodMeetings from '@/components/pods/PodMeetings';
import PodQuizzesWithArchive from '@/components/pods/PodQuizzesWithArchive';
import { WhiteboardTab } from '@/components/pods/WhiteboardTab';
import { PodMembers } from '@/components/pods/PodMembers';
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
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 mt-3 md:mt-6">
        <div className="space-y-4 md:space-y-6 pl-0 md:pl-8">
        {/* Header - Enhanced Styling */}
        <div className="flex items-center gap-2 md:gap-4 p-3 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/student-dashboard')}
            className="shrink-0 border-2 border-indigo-500/50 hover:bg-indigo-500 hover:text-white hover:scale-110 transition-all duration-300 shadow-md h-8 w-8 md:h-10 md:w-10"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
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
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 lg:w-fit lg:grid-cols-8 h-auto p-1.5 md:p-2 gap-1 md:gap-2 bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 rounded-xl md:rounded-2xl shadow-2xl border-2 border-white/10 overflow-x-auto">
            <TabsTrigger 
              value="overview" 
              className="gap-2 h-14 rounded-xl data-[state=active]:font-bold data-[state=active]:scale-105 data-[state=active]:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:bg-white/10 transition-all duration-300 data-[state=active]:border-2 data-[state=active]:border-blue-300"
            >
              <Users className="h-5 w-5" />
              <span className="hidden sm:inline font-semibold">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="members" 
              className="gap-2 h-14 rounded-xl data-[state=active]:font-bold data-[state=active]:scale-105 data-[state=active]:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:bg-white/10 transition-all duration-300 data-[state=active]:border-2 data-[state=active]:border-emerald-300"
            >
              <Users className="h-5 w-5" />
              <span className="hidden sm:inline font-semibold">Members</span>
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
            <Card className="border-2 border-blue-500/30 shadow-2xl bg-gradient-to-br from-blue-100/90 via-indigo-100/90 to-purple-100/90 dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-purple-900/40 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-b-2 border-blue-400/50 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-white/30">
                      <Users className="h-6 w-6 md:h-7 md:w-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Pod Information</CardTitle>
                  </div>
                  <Button 
                    variant="outline"
                    className="bg-red-500/20 backdrop-blur-sm border-red-400/40 text-white hover:bg-red-500/40 hover:border-red-400/60 font-semibold shadow-md"
                    onClick={handleLeavePod}
                    disabled={leaving}
                  >
                    {leaving ? 'Leaving...' : 'Leave Pod'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl p-5 border-2 border-blue-300/30 shadow-md">
                    <label className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2 block">Pod Title</label>
                    <p className="font-bold text-xl md:text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">{pod.title}</p>
                  </div>
                  {pod.description && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-xl p-5 border-2 border-indigo-300/30 shadow-md">
                      <label className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 block">Description</label>
                      <p className="font-medium text-foreground leading-relaxed">{pod.description}</p>
                    </div>
                  )}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-xl p-5 border-2 border-purple-300/30 shadow-md">
                    <label className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2 block">Subject</label>
                    <p className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">{pod.subject}</p>
                  </div>
                  {pod.profiles && (
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/50 rounded-xl p-5 border-2 border-pink-300/30 shadow-md">
                      <label className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 mb-2 block">Teacher</label>
                      <p className="font-bold text-lg bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent">
                        {pod.profiles.first_name} {pod.profiles.last_name}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <PodMembers podId={id!} teacherId={pod.teacher_id} />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <PodChat podId={id!} />
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <PodStickyNotes podId={id!} isTeacher={false} />
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <PodMeetings podId={id!} />
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            <PodMaterials podId={id!} isTeacher={false} />
          </TabsContent>

          <TabsContent value="quizzes" className="mt-6">
            <PodQuizzesWithArchive podId={id!} isTeacher={false} />
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