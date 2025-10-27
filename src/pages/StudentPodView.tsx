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
import { WhiteboardTab } from '@/components/pods/WhiteboardTab';
import { 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  FileText, 
  Upload, 
  Palette
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

      // Fetch pod details
      const { data: podData, error: podError } = await supabase
        .from('pods')
        .select(`
          *,
          profiles!pods_teacher_id_fkey(first_name, last_name)
        `)
        .eq('id', id)
        .single();

      if (podError) throw podError;

      // Transform the data to match our interface
      const transformedPod = {
        ...podData,
        profiles: Array.isArray(podData.profiles) ? podData.profiles[0] : podData.profiles
      };

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
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/student-dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{pod.title}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              {pod.profiles && (
                <>
                  <span>Teacher: {pod.profiles.first_name} {pod.profiles.last_name}</span>
                  <span>•</span>
                </>
              )}
              <span>{pod.subject}</span>
            </div>
            {pod.description && (
              <p className="text-muted-foreground mt-2">{pod.description}</p>
            )}
          </div>
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
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pod Information</CardTitle>
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

          <TabsContent value="materials" className="mt-6">
            <PodMaterials podId={id!} isTeacher={false} />
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