import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
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
import learnspaceLogo from '@/assets/learnspace-logo.png';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChats();
  }, [user?.id]);

  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
    }
  }, [currentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('learning_chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setChats((data || []) as Chat[]);
    } catch (error: any) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('learning_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const createNewChat = async () => {
    if (!user?.id) return;
    
    // Check subscription tier and chat limit for free students
    const { data: subscriptionData } = await supabase.functions.invoke('check-subscription');
    const isSubscribed = Boolean(subscriptionData?.subscribed);
    const currentChatCount = chats.length;
    
    // Free tier: limit to 3 chats
    if (!isSubscribed && currentChatCount >= 3) {
      toast({
        title: '🎓 Free tier limit reached',
        description: 'You can have up to 3 chats on the free plan. Upgrade to Learn+ for unlimited chats!',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('learning_chats')
        .insert([{
          user_id: user.id,
          title: 'New Chat',
        }])
        .select()
        .single();

      if (error) throw error;
      setChats([data as Chat, ...chats]);
      setCurrentChatId(data.id);
      setMessages([]);
    } catch (error: any) {
      toast({ title: 'Error creating chat', description: error.message, variant: 'destructive' });
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('learning_chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

      setChats(chats.filter(c => c.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      toast({ title: 'Chat deleted' });
    } catch (error: any) {
      toast({ title: 'Error deleting chat', description: error.message, variant: 'destructive' });
    }
  };

  const deleteAllChats = async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('learning_chats')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setChats([]);
      setCurrentChatId(null);
      setMessages([]);
      toast({ title: 'All chats deleted' });
    } catch (error: any) {
      toast({ title: 'Error deleting chats', description: error.message, variant: 'destructive' });
    }
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !selectedImage) || isLoading) return;
    if (!user?.id) return;

    let useChatId = currentChatId;
    if (!useChatId) {
      const { data, error } = await supabase
        .from('learning_chats')
        .insert([{ user_id: user.id, title: 'New Chat' }])
        .select()
        .single();
      if (error) {
        toast({ title: 'Error creating chat', description: error.message, variant: 'destructive' });
        return;
      }
      useChatId = data.id;
      setCurrentChatId(useChatId);
      setChats([data as Chat, ...chats]);
    }

    try {
      setIsLoading(true);

      let imageUrl: string | undefined;
      if (selectedImage) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedImage);
        await new Promise((resolve) => {
          reader.onloadend = () => {
            imageUrl = reader.result as string;
            resolve(null);
          };
        });
      }

      const { data: savedMessage, error: saveError } = await supabase
        .from('learning_messages')
        .insert([{
          chat_id: useChatId,
          role: 'user',
          content: inputMessage,
          image_url: imageUrl
        }])
        .select()
        .single();

      if (saveError) throw saveError;

      setMessages(prev => [...prev, savedMessage as Message]);
      setInputMessage('');
      setSelectedImage(null);
      setImagePreview(null);

      const chatHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const aiMessages = [];
      if (imageUrl) {
        aiMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: savedMessage.content },
            { type: 'image_url', image_url: { url: savedMessage.image_url } }
          ]
        });
      } else {
        aiMessages.push({
          role: 'user',
          content: savedMessage.content
        });
      }

      const { data: aiData, error: aiError } = await supabase.functions.invoke('learnspace-chat', {
        body: { messages: aiMessages, chatHistory }
      });

      if (aiError) throw aiError;

      const { data: aiMessage, error: aiSaveError } = await supabase
        .from('learning_messages')
        .insert([{
          chat_id: useChatId,
          role: 'assistant',
          content: aiData.response
        }])
        .select()
        .single();

      if (aiSaveError) throw aiSaveError;

      setMessages(prev => [...prev, aiMessage as Message]);

      if (messages.length === 0) {
        const title = savedMessage.content.slice(0, 50) || 'New Chat';
        await supabase
          .from('learning_chats')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', useChatId);
        
        setChats(chats.map(c => 
          c.id === useChatId ? { ...c, title, updated_at: new Date().toISOString() } : c
        ));
      } else {
        await supabase
          .from('learning_chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', useChatId);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({ 
        title: 'Error sending message', 
        description: error.message,
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
      <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 rounded-xl md:rounded-3xl overflow-hidden shadow-2xl border border-gray-200 mx-2 md:mx-4">
        {/* Sidebar */}
        <div className="hidden md:flex w-72 bg-white/60 backdrop-blur-xl border-r border-gray-200 flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <img src={learnspaceLogo} alt="Classpace Learnspace icon" className="h-12 w-12" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Learnspace
              </h1>
            </div>
            <Button
              onClick={createNewChat}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
            {chats.length > 0 && (
              <Button
                onClick={deleteAllChats}
                variant="outline"
                className="w-full mt-2 border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                    currentChatId === chat.id
                      ? "bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300"
                      : "hover:bg-gray-100/50"
                  )}
                  onClick={() => setCurrentChatId(chat.id)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <MessageSquare className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(chat.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-sm">
          <ScrollArea className="flex-1 p-6">
            {!currentChatId ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <img src={learnspaceLogo} alt="Classpace Learnspace icon" className="h-24 w-24 mb-8" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to Learnspace
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mb-8">
                  Your AI-powered learning companion. Ask any question, upload images of problems,
                  and get detailed explanations to help you learn better.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                  <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-purple-200">
                    <div className="text-4xl mb-3">📚</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Explain Topics</h3>
                    <p className="text-sm text-gray-600">
                      Get clear, comprehensive explanations on any subject
                    </p>
                  </Card>
                  <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-pink-200">
                    <div className="text-4xl mb-3">📸</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Upload Problems</h3>
                    <p className="text-sm text-gray-600">
                      Take a photo of any problem and get step-by-step solutions
                    </p>
                  </Card>
                  <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-blue-200">
                    <div className="text-4xl mb-3">🎯</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Personalized Learning</h3>
                    <p className="text-sm text-gray-600">
                      Context-aware responses based on your learning history
                    </p>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
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
                      <div className={cn(
                        "prose prose-sm max-w-none",
                        message.role === 'user' ? 'prose-invert' : ''
                      )}>
                        <ReactMarkdown
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 mt-4" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-2 mt-2" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                            em: ({node, ...props}) => <em className="italic" {...props} />,
                            code: ({node, inline, ...props}: any) => 
                              inline 
                                ? <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props} />
                                : <code className="block bg-gray-200 dark:bg-gray-700 p-3 rounded text-sm my-2 overflow-x-auto" {...props} />,
                            hr: ({node, ...props}) => <hr className="my-4 border-gray-300" {...props} />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
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
                <div ref={messagesEndRef} />
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
                className="flex-1 min-h-[60px] max-h-[120px] border-2 border-gray-300 focus:border-purple-500 rounded-2xl resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
                className="h-[60px] w-[60px] rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              >
                <Send className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Learnspace;
