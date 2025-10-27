import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';

interface DeletePodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  podId: string;
  podTitle: string;
}

export const DeletePodDialog: React.FC<DeletePodDialogProps> = ({
  open,
  onOpenChange,
  podId,
  podTitle,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('pods').delete().eq('id', podId);

      if (error) throw error;

      toast({
        title: 'Pod deleted successfully',
        description: 'All pod data has been permanently removed.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error deleting pod:', error);
      toast({
        title: 'Failed to delete pod',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg border-2 border-destructive/20">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl">Delete Pod</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-3 pt-2">
            <p className="font-semibold text-foreground">
              Are you sure you want to delete "{podTitle}"?
            </p>
            <p>This action cannot be undone. All associated data will be permanently deleted, including:</p>
            <ul className="list-disc list-inside space-y-1 text-sm pl-2">
              <li>All chat messages</li>
              <li>Notes and materials</li>
              <li>Student submissions</li>
              <li>Session history</li>
              <li>Pod members</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {deleting ? 'Deleting...' : 'Delete Pod'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
