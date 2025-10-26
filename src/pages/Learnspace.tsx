import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Plus, 
  Trash2, 
  Mic, 
  MicOff, 
  Image as ImageIcon,
  Sparkles,
  MessageSquare,
  Clock,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url?: string;
  created_at: string;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const Learnspace: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chats
  useEffect(() => {
    if (user?.id) {
      loadChats();
    }
  }, [user?.id]);

  // Load messages when chat changes
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    }
  }, [currentChatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChats = async () => {
    const { data, error } = await supabase
      .from('learning_chats')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading chats:', error);
      return;
    }

    setChats(data || []);
    if (data && data.length > 0 && !currentChatId) {
      setCurrentChatId(data[0].id);
    }
  };

  const loadMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from('learning_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages((data || []) as Message[]);
  };

  const createNewChat = async () => {
    const { data, error } = await supabase
      .from('learning_chats')
      .insert([{ user_id: user?.id, title: 'New Chat' }])
      .select()
      .single();

    if (error) {
      toast({ title: 'Error creating chat', description: error.message, variant: 'destructive' });
      return;
    }

    setChats([data, ...chats]);
    setCurrentChatId(data.id);
    setMessages([]);
  };

  const deleteChat = async (chatId: string) => {
    const { error } = await supabase
      .from('learning_chats')
      .delete()
      .eq('id', chatId);

    if (error) {
      toast({ title: 'Error deleting chat', description: error.message, variant: 'destructive' });
      return;
    }

    setChats(chats.filter(c => c.id !== chatId));
    if (currentChatId === chatId) {
      const remaining = chats.filter(c => c.id !== chatId);
      setCurrentChatId(remaining.length > 0 ? remaining[0].id : null);
      setMessages([]);
    }

    toast({ title: 'Chat deleted', description: 'Your chat has been removed.' });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !selectedImage) || !currentChatId || isLoading) return;

    setIsLoading(true);

    try {
      // Save user message
      const userMessage: any = {
        chat_id: currentChatId,
        role: 'user',
        content: inputMessage.trim() || 'Image uploaded',
      };

      if (imagePreview) {
        userMessage.image_url = imagePreview;
      }

      const { data: savedMessage, error: saveError } = await supabase
        .from('learning_messages')
        .insert([userMessage])
        .select()
        .single();

      if (saveError) throw saveError;

      setMessages([...messages, savedMessage as Message]);
      setInputMessage('');
      setSelectedImage(null);
      setImagePreview(null);

      // Get chat history for context
      const chatHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Build AI request
      const aiMessages: any[] = [
        { role: 'user', content: savedMessage.content }
      ];

      if (savedMessage.image_url) {
        aiMessages[0] = {
          role: 'user',
          content: [
            { type: 'text', text: savedMessage.content },
            { type: 'image_url', image_url: { url: savedMessage.image_url } }
          ]
        };
      }

      // Call AI edge function
      const { data: aiData, error: aiError } = await supabase.functions.invoke('learnspace-chat', {
        body: { messages: aiMessages, chatHistory }
      });

      if (aiError) throw aiError;

      // Save AI response
      const { data: aiMessage, error: aiSaveError } = await supabase
        .from('learning_messages')
        .insert([{
          chat_id: currentChatId,
          role: 'assistant',
          content: aiData.response
        }])
        .select()
        .single();

      if (aiSaveError) throw aiSaveError;

      setMessages(prev => [...prev, aiMessage as Message]);

      // Update chat title if it's the first message
      if (messages.length === 0) {
        const title = savedMessage.content.slice(0, 50) || 'New Chat';
        await supabase
          .from('learning_chats')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', currentChatId);
        
        setChats(chats.map(c => 
          c.id === currentChatId ? { ...c, title, updated_at: new Date().toISOString() } : c
        ));
      } else {
        await supabase
          .from('learning_chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentChatId);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to send message', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <DashboardLayout userRole="learner">
      <div className="h-screen flex bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        {/* Sidebar - Chat History */}
        <div className="w-80 border-r border-gray-200 bg-white/60 backdrop-blur-xl flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Learnspace
                </h2>
                <p className="text-xs text-gray-500">AI-Powered Learning</p>
              </div>
            </div>
            <Button onClick={createNewChat} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            {chats.map((chat) => (
              <Card
                key={chat.id}
                className={cn(
                  "mb-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-2",
                  currentChatId === chat.id 
                    ? "border-purple-500 bg-purple-50/50" 
                    : "border-transparent bg-white/40 hover:bg-white/60"
                )}
                onClick={() => setCurrentChatId(chat.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <h3 className="font-medium text-sm truncate text-gray-900">{chat.title}</h3>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(chat.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="ml-2 h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </ScrollArea>

          {/* Coming Soon Feature */}
          <div className="p-4 border-t border-gray-200">
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">AI Teaching Agent</h4>
                  <p className="text-xs text-gray-600">Coming Soon</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentChatId ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200 bg-white/60 backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {chats.find(c => c.id === currentChatId)?.title || 'Chat'}
                    </h3>
                    <p className="text-sm text-gray-500">Ask anything, upload images, get instant help</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-6 animate-fade-in">
                      <Sparkles className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Learnspace</h3>
                    <p className="text-gray-600 max-w-md mb-6">
                      Your AI-powered learning companion. Ask questions, upload problems, and get instant, comprehensive explanations.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
                      <Card className="p-4 bg-white/60 backdrop-blur-sm border-purple-200">
                        <MessageSquare className="h-8 w-8 text-purple-600 mb-2" />
                        <h4 className="font-semibold text-sm mb-1">Ask Questions</h4>
                        <p className="text-xs text-gray-600">Get detailed explanations on any topic</p>
                      </Card>
                      <Card className="p-4 bg-white/60 backdrop-blur-sm border-blue-200">
                        <ImageIcon className="h-8 w-8 text-blue-600 mb-2" />
                        <h4 className="font-semibold text-sm mb-1">Upload Images</h4>
                        <p className="text-xs text-gray-600">Get solutions to visual problems</p>
                      </Card>
                      <Card className="p-4 bg-white/60 backdrop-blur-sm border-pink-200">
                        <Sparkles className="h-8 w-8 text-pink-600 mb-2" />
                        <h4 className="font-semibold text-sm mb-1">Personalized</h4>
                        <p className="text-xs text-gray-600">AI learns from your chat history</p>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex animate-fade-in",
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl p-4 shadow-md",
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                              : 'bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-900'
                          )}
                        >
                          {message.image_url && (
                            <img
                              src={message.image_url}
                              alt="Uploaded"
                              className="rounded-lg mb-3 max-h-64 object-contain"
                            />
                          )}
                          <div className="prose prose-sm max-w-none">
                            {message.content.split('\n').map((line, i) => (
                              <p key={i} className={message.role === 'user' ? 'text-white' : 'text-gray-900'}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 shadow-md">
                          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="p-6 border-t border-gray-200 bg-white/60 backdrop-blur-xl">
                {imagePreview && (
                  <div className="mb-4 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border-2 border-purple-300" />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                    >
                      ×
                    </Button>
                  </div>
                )}
                <div className="flex items-end space-x-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50"
                  >
                    <ImageIcon className="h-5 w-5 text-purple-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setIsRecording(!isRecording);
                      toast({ 
                        title: 'Voice input coming soon', 
                        description: 'This feature will be available in the next update!' 
                      });
                    }}
                    className={cn(
                      "border-2",
                      isRecording 
                        ? "border-red-500 bg-red-50 hover:bg-red-100" 
                        : "border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                    )}
                  >
                    {isRecording ? (
                      <MicOff className="h-5 w-5 text-red-600" />
                    ) : (
                      <Mic className="h-5 w-5 text-blue-600" />
                    )}
                  </Button>
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask anything or upload an image..."
                    className="resize-none border-2 border-gray-300 focus:border-purple-500 bg-white/80 backdrop-blur-sm"
                    rows={2}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-[72px]"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Start a New Chat</h3>
                <p className="text-gray-600 mb-6">Create a new chat to begin your learning journey</p>
                <Button onClick={createNewChat} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Plus className="h-5 w-5 mr-2" />
                  New Chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Learnspace;