import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Clock, Play, Square } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ChatInterface from '@/components/sessions/ChatInterface';
import { format } from 'date-fns';

interface Session {
  id: string;
  pod_id: string;
  started_by: string;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'ended';
  title: string | null;
  pod: {
    name: string;
    description: string | null;
  };
}

const SessionView: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [endingSession, setEndingSession] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate('/dashboard');
      return;
    }
    fetchSession();
  }, [sessionId, user]);

  const fetchSession = async () => {
    if (!user || !sessionId) return;

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data: podData, error: podError } = await supabase
        .from('pods')
        .select('name, description')
        .eq('id', sessionData.pod_id)
        .single();

      if (podError) throw podError;

      setSession({
        ...sessionData,
        pod: podData
      } as Session);
    } catch (error) {
      console.error('Error fetching session:', error);
      toast({
        title: "Error",
        description: "Failed to load session",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!user || !session || session.started_by !== user.id) return;

    setEndingSession(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) throw error;

      toast({
        title: "Session Ended",
        description: "The session has been successfully ended.",
      });

      // Update local state
      setSession(prev => prev ? {
        ...prev,
        status: 'ended',
        ended_at: new Date().toISOString()
      } : null);
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEndingSession(false);
    }
  };

  const goBackToPod = () => {
    if (profile?.role === 'teacher') {
      navigate(`/pod/${session?.pod_id}`);
    } else {
      navigate(`/student/pod/${session?.pod_id}`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole={profile?.role || 'learner'}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout userRole={profile?.role || 'learner'}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Session Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The session you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isTeacher = profile?.role === 'teacher' && session.started_by === user?.id;
  const isActive = session.status === 'active';
  const sessionTitle = session.title || `Session ${format(new Date(session.started_at), 'MMM d, h:mm a')}`;

  return (
    <DashboardLayout userRole={profile?.role || 'learner'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={goBackToPod}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{sessionTitle}</h1>
              <p className="text-muted-foreground">{session.pod.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isActive ? "default" : "secondary"} className="px-3 py-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
              {isActive ? 'Live Session' : 'Session Ended'}
            </Badge>
            {isTeacher && isActive && (
              <Button
                onClick={endSession}
                disabled={endingSession}
                variant="destructive"
                size="sm"
              >
                <Square className="h-4 w-4 mr-2" />
                {endingSession ? 'Ending...' : 'End Session'}
              </Button>
            )}
          </div>
        </div>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Started</p>
                <p className="text-muted-foreground">
                  {format(new Date(session.started_at), 'MMM d, yyyy at h:mm a')}
                </p>
              </div>
              {session.ended_at && (
                <div>
                  <p className="text-sm font-medium">Ended</p>
                  <p className="text-muted-foreground">
                    {format(new Date(session.ended_at), 'MMM d, yyyy at h:mm a')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-muted-foreground">
                  {session.ended_at
                    ? `${Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / (1000 * 60))} minutes`
                    : 'Ongoing'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <ChatInterface sessionId={session.id} isTeacher={isTeacher} />
      </div>
    </DashboardLayout>
  );
};

export default SessionView;