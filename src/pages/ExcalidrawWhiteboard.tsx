import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Excalidraw } from '@excalidraw/excalidraw';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ExcalidrawWhiteboard() {
  const { whiteboardId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [whiteboard, setWhiteboard] = useState<any>(null);
  const [participants, setParticipants] = useState<number>(0);

  useEffect(() => {
    if (!whiteboardId) return;

    // Fetch whiteboard data
    const fetchWhiteboard = async () => {
      const { data, error } = await supabase
        .from('whiteboards')
        .select('*')
        .eq('id', whiteboardId)
        .single();

      if (error) {
        console.error('Error fetching whiteboard:', error);
        toast({
          title: 'Error loading whiteboard',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setWhiteboard(data);
    };

    fetchWhiteboard();

    // Set up presence tracking
    const channel = supabase.channel(`whiteboard:${whiteboardId}`, {
      config: {
        presence: { key: user?.id },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setParticipants(Object.keys(state).length);
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState();
        setParticipants(Object.keys(state).length);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState();
        setParticipants(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user?.id,
            userName: user?.user_metadata?.first_name || 'User',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [whiteboardId, user?.id]);

  // Add debouncing for save operations
  const [saveTimeout, setSaveTimeout] = React.useState<NodeJS.Timeout | null>(null);

  const handleChange = async (elements: any, appState: any) => {
    if (!whiteboardId || !whiteboard) return;

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout to save after 2 seconds of inactivity
    const timeout = setTimeout(async () => {
      try {
        await supabase
          .from('whiteboards')
          .update({
            whiteboard_data: {
              elements,
              appState,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', whiteboardId);
        
        console.log('Whiteboard saved successfully');
      } catch (error) {
        console.error('Error saving whiteboard:', error);
        toast({
          title: 'Failed to save',
          description: 'Could not save whiteboard changes',
          variant: 'destructive',
        });
      }
    }, 2000);

    setSaveTimeout(timeout);
  };

  if (!whiteboard) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">{whiteboard.title}</h1>
            <p className="text-sm text-gray-400">Collaborative Whiteboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
          <Users className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">{participants} online</span>
        </div>
      </div>

      {/* Excalidraw Canvas */}
      <div className="flex-1">
        <Excalidraw
          initialData={{
            elements: whiteboard.whiteboard_data?.elements || [],
            appState: whiteboard.whiteboard_data?.appState || {},
          }}
          onChange={handleChange}
          theme="dark"
        />
      </div>
    </div>
  );
}
