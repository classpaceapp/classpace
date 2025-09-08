import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  podId: string;
  onSessionStarted: (sessionId: string) => void;
}

const StartSessionModal: React.FC<StartSessionModalProps> = ({
  isOpen,
  onClose,
  podId,
  onSessionStarted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartSession = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          pod_id: podId,
          started_by: user.id,
          title: title.trim() || null,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Session Started",
        description: "Your learning session is now live!",
      });

      onSessionStarted(data.id);
      onClose();
      setTitle('');
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start New Session</DialogTitle>
          <DialogDescription>
            Create a new learning session for your pod. Students will be able to join and participate in real-time.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Session Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Math Review Session"
              maxLength={100}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleStartSession} disabled={loading}>
            {loading ? 'Starting...' : 'Start Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartSessionModal;