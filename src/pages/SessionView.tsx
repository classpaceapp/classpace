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
  title: string;
  started_at: string;
  ended_at: string | null;
  ai_recap: string | null;
  pod: {
    title: string;
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
        .select('title, description')
        .eq('id', sessionData.pod_id)
        .single();

      if (podError) throw podError;

      setSession({
        ...sessionData,
        pod: podData
      });
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
    if (!user || !session) return;

    setEndingSession(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

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

  const isTeacher = profile?.role === 'teacher';
  const isActive = !session.ended_at;
  const sessionTitle = session.title || `Session ${format(new Date(session.started_at), 'MMM d, h:mm a')}`;

  return (
    <DashboardLayout userRole={profile?.role || 'learner'}>
      <div className="space-y-4 md:space-y-6 px-3 md:px-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={goBackToPod} className="h-9 w-9 md:h-10 md:w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-3xl font-bold">{sessionTitle}</h1>
              <p className="text-sm md:text-base text-muted-foreground">{session.pod.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 ml-11 md:ml-0">
            <Badge variant={isActive ? "default" : "secondary"} className="px-2 md:px-3 py-1 text-xs md:text-sm">
              <div className={`w-2 h-2 rounded-full mr-1 md:mr-2 ${isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
              {isActive ? 'Live' : 'Ended'}
            </Badge>
            {isTeacher && isActive && (
              <Button
                onClick={endSession}
                disabled={endingSession}
                variant="destructive"
                size="sm"
                className="h-9 md:h-10"
              >
                <Square className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{endingSession ? 'Ending...' : 'End Session'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Session Info */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Clock className="h-4 w-4 md:h-5 md:w-5" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
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