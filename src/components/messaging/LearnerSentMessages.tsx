import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  ArrowLeft,
  Clock,
  CheckCircle2,
  MessageSquare,
  Mail,
  MailCheck,
  Sparkles,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  educator_id: string;
  subject: string;
  message: string;
  reply: string | null;
  replied_at: string | null;
  is_read: boolean;
  created_at: string;
  educator_profile?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    email: string | null;
  };
}

export const LearnerSentMessages: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

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
        .eq('learner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch educator profiles for each message
      const enrichedMessages = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, email')
            .eq('id', msg.educator_id)
            .single();

          return {
            ...msg,
            educator_profile: profileData || {
              first_name: 'Unknown',
              last_name: 'Educator',
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

  const repliedCount = messages.filter((m) => m.reply).length;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?';
  };

  if (loading) {
    return (
      <Card className="border-2 border-purple-500/30 shadow-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
            <span className="text-muted-foreground">Loading messages...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-500/30 shadow-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedMessage ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMessage(null)}
                className="hover:bg-purple-500/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <Send className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <CardTitle className="text-xl bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
                {selectedMessage ? 'Conversation' : 'Messages to Educators'}
              </CardTitle>
              {!selectedMessage && messages.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {repliedCount} of {messages.length} received replies
                </p>
              )}
            </div>
          </div>
          {!selectedMessage && repliedCount > 0 && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
              {repliedCount} replied
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {selectedMessage ? (
          // Message Detail View
          <div className="p-6 space-y-6">
            {/* Educator Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-purple-500/30">
                <AvatarImage src={selectedMessage.educator_profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
                  {getInitials(
                    selectedMessage.educator_profile?.first_name || '',
                    selectedMessage.educator_profile?.last_name || ''
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {selectedMessage.educator_profile?.first_name}{' '}
                  {selectedMessage.educator_profile?.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">Educator</p>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-lg">
                {selectedMessage.subject}
              </h4>
            </div>

            {/* Your Message */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Your message</span>
                <span>•</span>
                <Clock className="h-3 w-3" />
                <span>{format(new Date(selectedMessage.created_at), 'PPp')}</span>
              </div>
              <div className="p-4 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="whitespace-pre-wrap text-sm">{selectedMessage.message}</p>
              </div>
            </div>

            {/* Reply Section */}
            {selectedMessage.reply ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">Educator's reply</span>
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
            ) : (
              <div className="p-6 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/50 text-center">
                <Clock className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <h4 className="font-medium text-amber-800 dark:text-amber-300">Awaiting Reply</h4>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  The educator hasn't responded yet. You'll receive an email when they reply.
                </p>
              </div>
            )}
          </div>
        ) : messages.length === 0 ? (
          // Empty State
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No messages sent yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              When you contact educators through their public profiles, your conversations will appear here.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-purple-600">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Browse educators to find experts in your subjects</span>
            </div>
          </div>
        ) : (
          // Message List
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-purple-200/50 dark:divide-purple-800/50">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className="w-full p-4 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-purple-500/20">
                        <AvatarImage src={msg.educator_profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-sm font-bold">
                          {getInitials(
                            msg.educator_profile?.first_name || '',
                            msg.educator_profile?.last_name || ''
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {msg.reply && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                          <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">
                          {msg.educator_profile?.first_name} {msg.educator_profile?.last_name}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate text-purple-700 dark:text-purple-300">
                        {msg.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {msg.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {msg.reply ? (
                          <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 hover:bg-green-100">
                            <MailCheck className="h-3 w-3 mr-1" />
                            Replied {msg.replied_at && formatDistanceToNow(new Date(msg.replied_at), { addSuffix: true })}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            <Clock className="h-3 w-3 mr-1" />
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
