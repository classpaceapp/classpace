import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  FileText, 
  Download, 
  Palette, 
  Bot, 
  Clock
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
}

const StudentPodView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pod, setPod] = useState<Pod | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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
        .select('*')
        .eq('id', id)
        .single();

      if (podError) throw podError;

      // Get teacher info
      const { data: teacherProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', podData.teacher_id)
        .single();

      setPod({
        ...podData,
        teacher_name: teacherProfile 
          ? `${teacherProfile.first_name} ${teacherProfile.last_name}` 
          : 'Unknown Teacher'
      });
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
      <div className="space-y-6">
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
              <span>Teacher: {pod.teacher_name}</span>
              <span>• {pod.subject}</span>
            </div>
            {pod.description && (
              <p className="text-muted-foreground mt-2">{pod.description}</p>
            )}
          </div>
        </div>

        {/* Pod Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 lg:w-fit lg:grid-cols-7">
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
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="whiteboard" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Whiteboard</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Class Overview</CardTitle>
                <CardDescription>
                  View class information and classmates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Class Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Teacher</label>
                        <p className="font-medium">{pod.teacher_name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Subject</label>
                        <p className="font-medium">{pod.subject}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Classmates</h3>
                    <p className="text-muted-foreground">Classmate list coming soon!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Class Discussion</CardTitle>
                <CardDescription>
                  Chat with your teacher and classmates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Chat functionality coming soon!</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Class Notes</CardTitle>
                <CardDescription>
                  Read notes shared by your teacher
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Notes will appear here when your teacher shares them!</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Materials</CardTitle>
                <CardDescription>
                  Download and view materials shared by your teacher
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Materials will appear here when your teacher uploads them!</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whiteboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Collaborative Whiteboard</CardTitle>
                <CardDescription>
                  View and interact with the class whiteboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Whiteboard functionality coming soon!</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Study Assistant</CardTitle>
                <CardDescription>
                  Get help understanding concepts and preparing for tests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">AI study assistant coming soon!</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Class Activity</CardTitle>
                <CardDescription>
                  See what's been happening in your class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Activity timeline coming soon!</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StudentPodView;