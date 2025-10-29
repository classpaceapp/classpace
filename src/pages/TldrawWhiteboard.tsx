import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const TldrawWhiteboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [miroBoardId, setMiroBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWhiteboard = async () => {
      if (!id || !user?.id) return;

      try {
        setLoading(true);
        
        // Fetch the whiteboard data to get the Miro board ID
        const { data, error } = await supabase
          .from('whiteboards')
          .select('whiteboard_data, pod_id')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          toast({
            title: 'Whiteboard not found',
            description: 'This whiteboard may have been deleted or you do not have access to it.',
            variant: 'destructive',
          });
          return;
        }

        // Extract Miro board ID from whiteboard_data
        const boardId = (data.whiteboard_data as any)?.miro_board_id;
        if (!boardId) {
          toast({
            title: 'Invalid whiteboard',
            description: 'This whiteboard does not have a valid Miro board.',
            variant: 'destructive',
          });
          return;
        }

        setMiroBoardId(boardId);
      } catch (error: any) {
        console.error('Error loading whiteboard:', error);
        toast({
          title: 'Failed to load whiteboard',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadWhiteboard();
  }, [id, user?.id, toast]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!miroBoardId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Unable to load whiteboard</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0">
      <iframe
        src={`https://miro.com/app/live-embed/${miroBoardId}`}
        className="w-full h-full border-0"
        allow="fullscreen"
      />
    </div>
  );
};

export default TldrawWhiteboard;
