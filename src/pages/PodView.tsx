
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
import StartSessionModal from '@/components/sessions/StartSessionModal';
import SessionsList from '@/components/sessions/SessionsList';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { PodChat } from '@/components/pods/PodChat';
import { PodNotes } from '@/components/pods/PodNotes';
import { PodMaterials } from '@/components/pods/PodMaterials';
import { DeletePodDialog } from '@/components/pods/DeletePodDialog';
import { 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  FileText, 
  Upload, 
  Palette,
  Settings,
  Copy,
  Trash2
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
  const [startSessionModalOpen, setStartSessionModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
      <div className="space-y-6 pl-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{pod.title}</h1>
            {pod.description && (
              <p className="text-muted-foreground mt-1">{pod.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
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

        {/* Pod Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5">
            <TabsTrigger value="overview" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="whiteboard" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Whiteboard</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Sessions</CardTitle>
                      <CardDescription>
                        Start and manage learning sessions
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setStartSessionModalOpen(true)}
                    >
                      Start New Session
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <SessionsList podId={id!} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pod Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Subject</label>
                      <p className="font-medium">{pod.subject}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <PodChat podId={id!} />
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <PodNotes podId={id!} isTeacher={true} />
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            <PodMaterials podId={id!} isTeacher={true} />
          </TabsContent>

          <TabsContent value="whiteboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Collaborative Whiteboard</CardTitle>
                <CardDescription>
                  Interactive whiteboard for visual learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Whiteboard functionality coming soon!</p>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        <StartSessionModal
          isOpen={startSessionModalOpen}
          onClose={() => setStartSessionModalOpen(false)}
          podId={id!}
          onSessionStarted={(sessionId) => navigate(`/session/${sessionId}`)}
        />

        <DeletePodDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          podId={id!}
          podTitle={pod.title}
        />
      </div>
    </DashboardLayout>
  );
};

export default PodView;
