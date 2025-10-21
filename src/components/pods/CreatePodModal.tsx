import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreatePodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPodCreated: () => void;
}

const CreatePodModal: React.FC<CreatePodModalProps> = ({ open, onOpenChange, onPodCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.title.trim()) return;

    setLoading(true);
    try {
      const podCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create the pod
      const { error } = await supabase
        .from('pods')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          subject: formData.subject.trim(),
          teacher_id: user.id,
          pod_code: podCode
        });

      if (error) throw error;

      toast({
        title: "Pod created successfully!",
        description: `${formData.title} has been created.`,
      });

      // Reset form and close modal
      setFormData({ title: '', description: '', subject: '' });
      onOpenChange(false);
      onPodCreated();
    } catch (error: any) {
      console.error('Error creating pod:', error);
      toast({
        title: "Failed to create pod",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Pod</DialogTitle>
          <DialogDescription>
            Create a new learning space for your students. You can add students and materials later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Pod Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Biology 101, Math Grade 9"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of what this pod is about..."
              rows={3}
              className="w-full resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Subject
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="e.g., Mathematics, Science"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.title.trim()}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Pod'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePodModal;