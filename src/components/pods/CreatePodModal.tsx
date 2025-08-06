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
    name: '',
    description: '',
    subject: '',
    grade_level: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.name.trim()) return;

    setLoading(true);
    try {
      // Create the pod
      const { data: pod, error: podError } = await supabase
        .from('pods')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          subject: formData.subject.trim() || null,
          grade_level: formData.grade_level.trim() || null,
          created_by: user.id
        })
        .select()
        .single();

      if (podError) throw podError;

      // Add the creator as a teacher member
      const { error: memberError } = await supabase
        .from('pod_members')
        .insert({
          pod_id: pod.id,
          user_id: user.id,
          role: 'teacher'
        });

      if (memberError) throw memberError;

      toast({
        title: "Pod created successfully!",
        description: `${formData.name} has been created and you've been added as a teacher.`,
      });

      // Reset form and close modal
      setFormData({ name: '', description: '', subject: '', grade_level: '' });
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
            <Label htmlFor="name" className="text-sm font-medium">
              Pod Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
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

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="grade_level" className="text-sm font-medium">
                Grade Level
              </Label>
              <Input
                id="grade_level"
                value={formData.grade_level}
                onChange={(e) => handleInputChange('grade_level', e.target.value)}
                placeholder="e.g., Grade 9, High School"
              />
            </div>
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
              disabled={loading || !formData.name.trim()}
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