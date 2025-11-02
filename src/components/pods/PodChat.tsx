import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  pod_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name?: string;
}

interface PodChatProps {
  podId: string;
}

export const PodChat: React.FC<PodChatProps> = ({ podId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const { data: msgs, error: msgError } = await supabase
        .from('pod_messages')
        .select('*')
        .eq('pod_id', podId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      const messages = (msgs || []) as any[];
      const userIds = Array.from(new Set(messages.map(m => m.user_id).filter(Boolean)));

      let profilesMap: Record<string, { first_name: string | null; last_name: string | null }> = {};
      if (userIds.length) {
        const { data: profs, error: profErr } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);
        if (!profErr && profs) {
          profilesMap = Object.fromEntries(
            profs.map((p: any) => [p.id, { first_name: p.first_name, last_name: p.last_name }])
          );
        }
      }

      const messagesWithNames = messages.map((msg: any) => {
        const p = profilesMap[msg.user_id];
        return {
          ...msg,
          user_name: p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown User' : 'Unknown User',
        } as Message;
      });

      setMessages(messagesWithNames);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Failed to load messages',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.id) return;

    setSending(true);
    try {
      const { error } = await supabase.from('pod_messages').insert({
        pod_id: podId,
        user_id: user.id,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
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

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('pod-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pod_messages',
          filter: `pod_id=eq.${podId}`,
        },
        async (payload) => {
          // Fetch user info for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', payload.new.user_id)
            .single();

          const newMsg = {
            ...payload.new,
            user_name: profile
              ? `${profile.first_name} ${profile.last_name}`
              : 'Unknown User',
          } as Message;

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [podId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <Card className="border-2 border-blue-500/30 shadow-2xl bg-gradient-to-br from-blue-100/90 via-indigo-100/90 to-purple-100/90 dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-purple-900/40 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-b-2 border-blue-400/50 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-white/30">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
              </span>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Real-time Chat</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-500/30 shadow-2xl bg-gradient-to-br from-blue-100/90 via-indigo-100/90 to-purple-100/90 dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-purple-900/40 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-b-2 border-blue-400/50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-white/30">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
            </span>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Real-time Chat</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] md:h-[500px] p-3 md:p-4" ref={scrollRef}>
          <div className="space-y-3 md:space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 ${
                    msg.user_id === user?.id ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{msg.user_name}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(msg.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div
                    className={`rounded-2xl px-3 py-2 md:px-4 md:py-2 max-w-[85%] md:max-w-[70%] shadow-sm ${
                      msg.user_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <p className="text-sm md:text-sm break-words">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <form
          onSubmit={sendMessage}
          className="flex gap-2 p-3 md:p-4 border-t border-primary/10 bg-card"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1 border-primary/20 focus-visible:ring-primary h-12 md:h-10 text-base"
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            size="icon"
            className="bg-primary hover:bg-primary/90 h-12 w-12 md:h-10 md:w-10"
          >
            <Send className="h-5 w-5 md:h-4 md:w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
