
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { PodChat } from '@/components/pods/PodChat';
import { PodNotes } from '@/components/pods/PodNotes';
import { PodMaterials } from '@/components/pods/PodMaterials';
import { PodMeetings } from '@/components/pods/PodMeetings';
import { PodQuizzes } from '@/components/pods/PodQuizzes';
import { DeletePodDialog } from '@/components/pods/DeletePodDialog';
import { WhiteboardTab } from '@/components/pods/WhiteboardTab';
import { EditPodDialog } from '@/components/pods/EditPodDialog';
import { 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  FileText, 
  Upload, 
  Palette,
  Settings,
  Copy,
  Trash2,
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
  is_public: boolean;
}

const PodView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pod, setPod] = useState<Pod | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchPod = async () => {
    if (!id || !user?.id) return;

    try {
      setLoading(true);
      const { data: podData, error: podError } = await supabase
        .from('pods')
        .select('*')
        .eq('id', id)
        .single();

      if (podError) throw podError;

      // Authorization: teacher or member
      const isTeacher = podData.teacher_id === user.id;
      if (!isTeacher) {
        const { data: membership, error: memberError } = await supabase
          .from('pod_members')
          .select('*')
          .eq('pod_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (memberError || !membership) {
          toast({ title: 'Access denied', description: "You don't have permission to view this pod.", variant: 'destructive' });
          navigate('/dashboard');
          return;
        }
      }

      setPod(podData as Pod);
    } catch (error: any) {
      console.error('Error fetching pod:', error);
      toast({ title: 'Failed to load pod', description: error.message || 'Please try again later.', variant: 'destructive' });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const togglePublic = async (checked: boolean) => {
    if (!pod || !user?.id) return;
    try {
      const { error } = await supabase
        .from('pods')
        .update({ is_public: checked })
        .eq('id', pod.id)
        .eq('teacher_id', user.id);
      if (error) throw error;
      setPod({ ...pod, is_public: checked });
      toast({ title: checked ? 'Pod is now public' : 'Pod set to private' });
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  const copyJoinCode = () => {
    if (pod?.pod_code) {
      navigator.clipboard.writeText(pod.pod_code);
      toast({ title: 'Join code copied!', description: 'Share this code with your students.' });
    }
  };

  useEffect(() => {
    fetchPod();
  }, [id, user?.id]);

  if (loading) {
    return (
      <DashboardLayout userRole="teacher">
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
      <DashboardLayout userRole="teacher">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-muted-foreground">Pod not found</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="container mx-auto px-4 py-8 mt-6">
        <div className="space-y-6 pl-8">
        {/* Header - Enhanced Styling */}
        <div className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="shrink-0 border-2 border-indigo-500/50 hover:bg-indigo-500 hover:text-white hover:scale-110 transition-all duration-300 shadow-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
              {pod.title}
            </h1>
            {pod.description && (
              <p className="text-muted-foreground mt-2 text-lg font-medium">{pod.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-indigo-500 text-white text-sm font-semibold rounded-full shadow-sm">
                {pod.subject}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 mr-8">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Pod Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="public-toggle" className="text-sm cursor-pointer">
                    Public Pod
                  </Label>
                  <Switch
                    id="public-toggle"
                    checked={pod.is_public}
                    onCheckedChange={togglePublic}
                  />
                </div>
                {!pod.is_public && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs text-muted-foreground">Join Code</Label>
                    <div className="flex gap-2">
                      <code className="flex-1 px-3 py-2 bg-secondary rounded text-sm font-mono">
                        {pod.pod_code}
                      </code>
                      <Button size="sm" variant="outline" onClick={copyJoinCode}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Pod
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setEditDialogOpen(true)}
                    >
                      Edit Details
                    </Button>
                    <Button 
                      variant="outline"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Pod
                    </Button>
                  </div>
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
                  <div>
                    <label className="text-sm text-muted-foreground">Pod Code</label>
                    <div className="flex gap-2 items-center mt-1">
                      <code className="px-3 py-2 bg-secondary rounded text-sm font-mono">
                        {pod.pod_code}
                      </code>
                      <Button size="sm" variant="outline" onClick={copyJoinCode}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <PodChat podId={id!} />
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <PodNotes podId={id!} isTeacher={true} />
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <PodMeetings podId={id!} />
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            <PodMaterials podId={id!} isTeacher={true} />
          </TabsContent>

          <TabsContent value="quizzes" className="mt-6">
            <PodQuizzes podId={id!} isTeacher={true} />
          </TabsContent>

          <TabsContent value="whiteboard" className="mt-6">
            <WhiteboardTab podId={id!} isTeacher={true} />
          </TabsContent>

        </Tabs>

        <DeletePodDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          podId={id!}
          podTitle={pod.title}
        />

        <EditPodDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          podId={id!}
          currentTitle={pod.title}
          currentDescription={pod.description}
          currentSubject={pod.subject}
          onUpdate={fetchPod}
        />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PodView;
