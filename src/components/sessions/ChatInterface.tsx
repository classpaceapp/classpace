import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, FileText, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  user_id: string | null;
  is_ai: boolean;
  message_type: 'text' | 'file' | 'system';
  file_url: string | null;
  created_at: string;
  user?: {
    first_name?: string;
    last_name?: string;
  };
}

interface ChatInterfaceProps {
  sessionId: string;
  isTeacher: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, isTeacher }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    setupRealtimeSubscription();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('session_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const transformedMessages = (data || []).map(msg => ({
        id: msg.id,
        content: msg.message,
        user_id: msg.user_id,
        is_ai: false,
        message_type: 'text' as const,
        file_url: null,
        created_at: msg.created_at
      }));
      
      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`session-${sessionId}-messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          const transformedMsg: Message = {
            id: newMsg.id,
            content: newMsg.message,
            user_id: newMsg.user_id,
            is_ai: false,
            message_type: 'text',
            file_url: null,
            created_at: newMsg.created_at
          };
          setMessages(prev => [...prev, transformedMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('session_messages')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          message: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageDisplayName = (message: Message) => {
    if (message.is_ai) return 'AI Assistant';
    if (message.user?.first_name || message.user?.last_name) {
      return `${message.user.first_name || ''} ${message.user.last_name || ''}`.trim();
    }
    return 'User';
  };

  const getMessageInitials = (message: Message) => {
    if (message.is_ai) return 'AI';
    const name = getMessageDisplayName(message);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle>Session Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-pulse">Loading messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Session Chat
            <Badge variant="secondary" className="ml-2">
              {messages.length} messages
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className={message.is_ai ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                      {message.is_ai ? <Bot className="h-4 w-4" /> : getMessageInitials(message)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {getMessageDisplayName(message)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), 'h:mm a')}
                      </span>
                    </div>
                    <div className="text-sm">
                      {message.message_type === 'file' ? (
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                          <FileText className="h-4 w-4" />
                          <span className="flex-1">{message.content}</span>
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;