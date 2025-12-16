import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Inbox,
  Mail,
  MailOpen,
  Send,
  ArrowLeft,
  Clock,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const replySchema = z.object({
  reply: z.string().trim().min(1, 'Reply cannot be empty').max(2000, 'Reply must be less than 2000 characters'),
});

interface Message {
  id: string;
  learner_id: string;
  subject: string;
  message: string;
  reply: string | null;
  replied_at: string | null;
  is_read: boolean;
  created_at: string;
  learner_profile?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    email: string | null;
  };
}

export const TeacherInbox: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchMessages();
    }
  }, [user?.id]);

  const fetchMessages = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('educator_messages')
        .select('*')
        .eq('educator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch learner profiles for each message
      const enrichedMessages = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, email')
            .eq('id', msg.learner_id)
            .single();

          return {
            ...msg,
            learner_profile: profileData || {
              first_name: 'Unknown',
              last_name: 'User',
              avatar_url: null,
              email: null,
            },
          };
        })
      );

      setMessages(enrichedMessages);
    } catch (error: any) {
      toast({
        title: 'Failed to load messages',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (msg: Message) => {
    setSelectedMessage(msg);
    setReplyText(msg.reply || '');
    setReplyError(null);

    // Mark as read if unread
    if (!msg.is_read) {
      try {
        await supabase
          .from('educator_messages')
          .update({ is_read: true })
          .eq('id', msg.id);

        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m))
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !user?.id) return;

    // Validate
    const validation = replySchema.safeParse({ reply: replyText });
    if (!validation.success) {
      setReplyError(validation.error.errors[0].message);
      return;
    }

    setReplyError(null);
    setSending(true);

    try {
      const { error } = await supabase
        .from('educator_messages')
        .update({
          reply: replyText.trim(),
          replied_at: new Date().toISOString(),
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      // Trigger email notification to learner
      try {
        await supabase.functions.invoke('notify-educator-message', {
          body: {
            type: 'reply',
            messageId: selectedMessage.id,
            learnerId: selectedMessage.learner_id,
            educatorId: user.id,
            subject: selectedMessage.subject,
            replyPreview: replyText.trim().substring(0, 200),
          },
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }

      // Update local state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedMessage.id
            ? { ...m, reply: replyText.trim(), replied_at: new Date().toISOString() }
            : m
        )
      );

      setSelectedMessage({
        ...selectedMessage,
        reply: replyText.trim(),
        replied_at: new Date().toISOString(),
      });

      toast({
        title: 'Reply sent!',
        description: 'Your response has been sent to the student.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send reply',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?';
  };

  if (loading) {
    return (
      <Card className="border-2 border-teal-500/30 shadow-xl bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
            <span className="text-muted-foreground">Loading messages...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-teal-500/30 shadow-xl bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20">
      <CardHeader className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-b border-teal-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedMessage ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMessage(null)}
                className="hover:bg-teal-500/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <div className="p-2.5 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg">
                <Inbox className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <CardTitle className="text-xl bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
                {selectedMessage ? 'Message Details' : 'Student Messages'}
              </CardTitle>
              {!selectedMessage && unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          {!selectedMessage && unreadCount > 0 && (
            <Badge className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
              {unreadCount} new
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {selectedMessage ? (
          // Message Detail View
          <div className="p-6 space-y-6">
            {/* Learner Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-teal-500/30">
                <AvatarImage src={selectedMessage.learner_profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold">
                  {getInitials(
                    selectedMessage.learner_profile?.first_name || '',
                    selectedMessage.learner_profile?.last_name || ''
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {selectedMessage.learner_profile?.first_name}{' '}
                  {selectedMessage.learner_profile?.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedMessage.learner_profile?.email || 'No email'}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(selectedMessage.created_at), 'PPp')}
                </div>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="space-y-4">
              <h4 className="font-semibold text-teal-900 dark:text-teal-100 text-lg">
                {selectedMessage.subject}
              </h4>
              
              {/* Student's Message */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Student's message</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(selectedMessage.created_at), 'PPp')}</span>
                </div>
                <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                  <p className="whitespace-pre-wrap text-sm">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Your Reply (if already sent) */}
              {selectedMessage.reply && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">Your reply</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>
                      {selectedMessage.replied_at
                        ? format(new Date(selectedMessage.replied_at), 'PPp')
                        : 'Unknown'}
                    </span>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="whitespace-pre-wrap text-sm">{selectedMessage.reply}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Reply Input Section */}
            <div className="space-y-3 pt-4 border-t border-teal-200/50 dark:border-teal-800/50">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-teal-600" />
                <h4 className="font-semibold text-teal-900 dark:text-teal-100">
                  {selectedMessage.reply ? 'Edit Your Reply' : 'Send a Reply'}
                </h4>
              </div>

              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply to the student..."
                rows={4}
                maxLength={2000}
                className={`border-teal-200 focus:border-teal-500 focus:ring-teal-500 resize-none ${
                  replyError ? 'border-red-500' : ''
                }`}
              />
              {replyError && <p className="text-xs text-red-500">{replyError}</p>}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{replyText.length}/2000</p>
                <Button
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {selectedMessage.reply ? 'Update Reply' : 'Send Reply'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          // Empty State
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900 dark:to-cyan-900 rounded-full flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              When students contact you through your public profile, their messages will appear here.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-teal-600">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Make sure your profile is public to receive messages</span>
            </div>
          </div>
        ) : (
          // Message List
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-teal-200/50 dark:divide-teal-800/50">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className="w-full p-4 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-teal-500/20">
                        <AvatarImage src={msg.learner_profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-sm font-bold">
                          {getInitials(
                            msg.learner_profile?.first_name || '',
                            msg.learner_profile?.last_name || ''
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {!msg.is_read && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full border-2 border-white dark:border-gray-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-medium truncate ${!msg.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {msg.learner_profile?.first_name} {msg.learner_profile?.last_name}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${!msg.is_read ? 'font-medium' : ''}`}>
                        {msg.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {msg.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {!msg.is_read ? (
                          <Badge variant="secondary" className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                            <Mail className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        ) : msg.reply ? (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Replied
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <MailOpen className="h-3 w-3 mr-1" />
                            Awaiting reply
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
