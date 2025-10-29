import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tldraw } from 'tldraw';
import { useSyncDemo } from '@tldraw/sync';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import 'tldraw/tldraw.css';

const TldrawWhiteboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use the tldraw sync demo with the whiteboard ID as the room ID
  const roomId = `classpace-${id}`;
  const store = useSyncDemo({ roomId });

  useEffect(() => {
    const verifyWhiteboardAccess = async () => {
      if (!id || !user?.id) return;

      try {
        // Verify user has access to this whiteboard
        const { data, error } = await supabase
          .from('whiteboards')
          .select('pod_id')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          toast({
            title: 'Whiteboard not found',
            description: 'This whiteboard may have been deleted or you do not have access to it.',
            variant: 'destructive',
          });
          // Do not navigate away; keep the whiteboard visible to avoid blank screen
          return;
        }
      } catch (error: any) {
        console.error('Error verifying whiteboard access:', error);
        toast({
          title: 'Failed to verify access',
          description: error.message,
          variant: 'destructive',
        });
        // Do not navigate away on error to prevent blank screen
      }
    };

    verifyWhiteboardAccess();
  }, [id, user?.id, navigate, toast]);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw store={store} />
    </div>
  );
};

export default TldrawWhiteboard;
