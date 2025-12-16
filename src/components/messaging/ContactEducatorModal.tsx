import React, { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, CheckCircle2, Sparkles } from 'lucide-react';

const messageSchema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').max(100, 'Subject must be less than 100 characters'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(1000, 'Message must be less than 1000 characters'),
});

interface ContactEducatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  educatorId: string;
  educatorName: string;
}

export const ContactEducatorModal: React.FC<ContactEducatorModalProps> = ({
  isOpen,
  onClose,
  educatorId,
  educatorName,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({});

  const handleSend = async () => {
    if (!user?.id) {
      toast({
        title: 'Login required',
        description: 'Please log in to contact educators',
        variant: 'destructive',
      });
      return;
    }

    // Validate input
    const validation = messageSchema.safeParse({ subject, message });
    if (!validation.success) {
      const fieldErrors: { subject?: string; message?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'subject') fieldErrors.subject = err.message;
        if (err.path[0] === 'message') fieldErrors.message = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSending(true);

    try {
      // Insert message
      const { error: insertError } = await supabase
        .from('educator_messages')
        .insert({
          educator_id: educatorId,
          learner_id: user.id,
          subject: subject.trim(),
          message: message.trim(),
        });

      if (insertError) throw insertError;

      // Trigger email notification to educator
      try {
        await supabase.functions.invoke('notify-educator-message', {
          body: {
            type: 'new_message',
            educatorId,
            learnerId: user.id,
            subject: subject.trim(),
            messagePreview: message.trim().substring(0, 200),
          },
        });
      } catch (emailError) {
        // Don't fail the whole operation if email fails
        console.error('Email notification failed:', emailError);
      }

      setSent(true);
      toast({
        title: 'Message sent!',
        description: `Your message has been sent to ${educatorName}`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSubject('');
    setMessage('');
    setSent(false);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-white to-teal-50/30 dark:from-gray-900 dark:to-teal-950/30 border-teal-200 dark:border-teal-800">
        {sent ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Message Sent!
            </h3>
            <p className="text-muted-foreground">
              Your message has been delivered to {educatorName}. They'll receive an email notification and can reply through Classpace.
            </p>
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-md">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
                    Contact {educatorName}
                  </DialogTitle>
                  <DialogDescription>
                    Send a message to this educator
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What would you like to discuss?"
                  maxLength={100}
                  className={`border-teal-200 focus:border-teal-500 focus:ring-teal-500 ${
                    errors.subject ? 'border-red-500' : ''
                  }`}
                />
                {errors.subject && (
                  <p className="text-xs text-red-500">{errors.subject}</p>
                )}
                <p className="text-xs text-muted-foreground text-right">
                  {subject.length}/100
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium">
                  Your Message
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce yourself and explain what you'd like help with..."
                  maxLength={1000}
                  rows={6}
                  className={`border-teal-200 focus:border-teal-500 focus:ring-teal-500 resize-none ${
                    errors.message ? 'border-red-500' : ''
                  }`}
                />
                {errors.message && (
                  <p className="text-xs text-red-500">{errors.message}</p>
                )}
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/1000
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-800">
                <Sparkles className="h-4 w-4 text-teal-600 shrink-0" />
                <p className="text-xs text-teal-700 dark:text-teal-300">
                  The educator will receive an email notification and can reply directly through Classpace.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sending || !subject.trim() || !message.trim()}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
