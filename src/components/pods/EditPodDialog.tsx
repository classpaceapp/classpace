import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditPodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  podId: string;
  currentTitle: string;
  currentDescription: string | null;
  currentSubject: string;
  onUpdate: () => void;
}

export const EditPodDialog: React.FC<EditPodDialogProps> = ({
  open,
  onOpenChange,
  podId,
  currentTitle,
  currentDescription,
  currentSubject,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription || '');
  const [subject, setSubject] = useState(currentSubject);
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!title.trim() || !subject.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both title and subject',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('pods')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          subject: subject.trim(),
        })
        .eq('id', podId);

      if (error) throw error;

      toast({
        title: 'Pod updated successfully',
      });

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Failed to update pod',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-[95vw] md:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pod Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Pod Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter pod title"
              className="h-12 md:h-10 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-subject">Subject</Label>
            <Input
              id="edit-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Mathematics, Science"
              className="h-12 md:h-10 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (Optional)</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the pod"
              rows={3}
              className="text-base"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 flex-col md:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updating} className="w-full md:w-auto h-12 md:h-10">
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={updating} className="w-full md:w-auto h-12 md:h-10">
            {updating ? 'Updating...' : 'Update Pod'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
