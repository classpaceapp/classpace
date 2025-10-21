import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import SessionCard from './SessionCard';

interface Session {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  ai_recap: string | null;
}

interface SessionsListProps {
  podId: string;
}

const SessionsList: React.FC<SessionsListProps> = ({ podId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
    setupRealtimeSubscription();
  }, [podId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('pod_id', podId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`pod-${podId}-sessions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `pod_id=eq.${podId}`,
        },
        () => {
          fetchSessions(); // Refetch when any session changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleJoinSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  const handleViewSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          No sessions yet. Start your first session to begin learning!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onJoinSession={handleJoinSession}
          onViewSession={handleViewSession}
          canJoin={true} // For now, allow all pod members to join
        />
      ))}
    </div>
  );
};

export default SessionsList;