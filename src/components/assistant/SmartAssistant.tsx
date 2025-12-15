import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Sparkles, User, Loader2, X, Maximize2, Minimize2, Mic, MicOff, Save, Download, History, Trash2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SavedConversation {
  id: string;
  title: string;
  messages: Message[];
  user_role: string;
  created_at: string;
  updated_at: string;
}

interface SmartAssistantProps {
  userRole: 'teacher' | 'learner';
}

const TEACHER_SUGGESTIONS = [
  "How are my students performing across all pods?",
  "Which quizzes have the lowest average scores?",
  "Give me a summary of all my pods and student counts",
  "What assessments have been completed this week?",
  "Suggest ways to improve student engagement",
  "Which students haven't attempted any quizzes?",
];

const STUDENT_SUGGESTIONS = [
  "What should I study based on my notes?",
  "How am I doing on my quizzes?",
  "Summarize my notes on the latest topic",
  "What flashcards should I review today?",
  "Help me prepare for my upcoming classes",
  "What pods am I enrolled in?",
];

const SmartAssistant: React.FC<SmartAssistantProps> = ({ userRole }) => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const suggestions = userRole === 'teacher' ? TEACHER_SUGGESTIONS : STUDENT_SUGGESTIONS;
  const assistantName = userRole === 'teacher' ? 'Teaching Assistant' : 'Learning Assistant';
  const userName = profile?.first_name || 'there';

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch saved conversations
  const fetchSavedConversations = useCallback(async () => {
    if (!user?.id) return;
    setLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from('assistant_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('user_role', userRole)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Parse messages from JSON
      const conversations = (data || []).map(conv => ({
        ...conv,
        messages: (conv.messages as unknown as Message[]) || []
      }));
      setSavedConversations(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, [user?.id, userRole]);

  useEffect(() => {
    if (showHistory) {
      fetchSavedConversations();
    }
  }, [showHistory, fetchSavedConversations]);

  // Save current conversation
  const saveConversation = useCallback(async () => {
    if (!user?.id || messages.length === 0) {
      toast({
        title: "Nothing to save",
        description: "Start a conversation first before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      const title = messages[0]?.content.slice(0, 50) + (messages[0]?.content.length > 50 ? '...' : '');
      
      if (currentConversationId) {
        // Update existing conversation
        const { error } = await supabase
          .from('assistant_conversations')
          .update({
            messages: messages.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp.toISOString() })),
            title,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentConversationId);
        
        if (error) throw error;
        toast({
          title: "Conversation updated",
          description: "Your conversation has been saved.",
        });
      } else {
        // Create new conversation
        const { data, error } = await supabase
          .from('assistant_conversations')
          .insert([{
            user_id: user.id,
            title,
            messages: messages.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp.toISOString() })),
            user_role: userRole,
          }])
          .select()
          .single();
        
        if (error) throw error;
        setCurrentConversationId(data.id);
        toast({
          title: "Conversation saved",
          description: "Your conversation has been saved to history.",
        });
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast({
        title: "Error",
        description: "Failed to save conversation. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.id, messages, currentConversationId, userRole, toast]);

  // Load a saved conversation
  const loadConversation = useCallback((conversation: SavedConversation) => {
    setMessages(conversation.messages.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp)
    })));
    setCurrentConversationId(conversation.id);
    setShowHistory(false);
    toast({
      title: "Conversation loaded",
      description: `Loaded: ${conversation.title}`,
    });
  }, [toast]);

  // Delete a saved conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('assistant_conversations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSavedConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
      toast({
        title: "Deleted",
        description: "Conversation has been deleted.",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive",
      });
    }
  }, [currentConversationId, toast]);

  // Export conversation as text
  const exportConversation = useCallback(() => {
    if (messages.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Start a conversation first.",
        variant: "destructive",
      });
      return;
    }

    const content = messages.map(m => {
      const role = m.role === 'user' ? 'You' : 'Assistant';
      const time = format(new Date(m.timestamp), 'PPp');
      return `[${time}] ${role}:\n${m.content}\n`;
    }).join('\n---\n\n');

    const header = `Classpace ${assistantName} Conversation\nExported: ${format(new Date(), 'PPpp')}\n\n${'='.repeat(50)}\n\n`;
    const fullContent = header + content;

    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assistant-conversation-${format(new Date(), 'yyyy-MM-dd-HHmm')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Conversation has been downloaded as a text file.",
    });
  }, [messages, assistantName, toast]);

  // Start new conversation
  const startNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
  }, []);

  // Voice recognition setup
  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setInputMessage(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event);
      setIsListening(false);
      toast({
        title: "Voice error",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    
    toast({
      title: "Listening...",
      description: "Speak now. Click the mic button again to stop.",
    });
  }, [toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputMessage.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const chatMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ messages: chatMessages }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                setStreamingContent(fullContent);
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Finalize the assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fullContent || 'I apologize, but I couldn\'t generate a response. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');

    } catch (error: any) {
      console.error('Smart assistant error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get response. Please try again.',
        variant: 'destructive',
      });

      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error. Please try again in a moment.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <Card className={cn(
      "flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/50 border-0 shadow-xl overflow-hidden transition-all duration-300",
      isExpanded ? "fixed inset-4 z-50 rounded-3xl" : "h-[600px] rounded-2xl"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center gap-3">
          {showHistory ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                  <img 
                    src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                    alt="Classpace" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {showHistory ? 'Saved Conversations' : assistantName}
            </h2>
            <p className="text-xs text-gray-500">
              {showHistory ? `${savedConversations.length} conversation(s)` : 'Powered by AI • Full context access'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!showHistory && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={saveConversation}
                disabled={messages.length === 0}
                className="text-gray-400 hover:text-purple-600"
                title="Save conversation"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={exportConversation}
                disabled={messages.length === 0}
                className="text-gray-400 hover:text-purple-600"
                title="Export conversation"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(true)}
                className="text-gray-400 hover:text-purple-600"
                title="View saved conversations"
              >
                <History className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Messages Area or History */}
      <ScrollArea className="flex-1 px-4 md:px-6 py-4">
        {showHistory ? (
          // Saved Conversations List
          <div className="space-y-3">
            <Button
              onClick={startNewConversation}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl py-3 mb-4"
            >
              + New Conversation
            </Button>
            
            {loadingConversations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : savedConversations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No saved conversations yet</p>
                <p className="text-sm">Start a conversation and save it to see it here</p>
              </div>
            ) : (
              savedConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="bg-white/80 rounded-xl p-4 border border-gray-100 hover:border-purple-200 transition-all cursor-pointer group"
                  onClick={() => loadConversation(conv)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{conv.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(conv.updated_at), 'PPp')} • {conv.messages.length} messages
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : messages.length === 0 && !streamingContent ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-0.5 shadow-2xl mb-6">
              <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                <img 
                  src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                  alt="Classpace" 
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Hey {userName}! 👋
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              I'm your {userRole === 'teacher' ? 'teaching' : 'learning'} assistant with complete access to your Classpace data. Ask me anything!
            </p>
            
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-2 text-xs font-medium bg-white/80 hover:bg-white border border-purple-200 hover:border-purple-400 rounded-full text-gray-700 hover:text-purple-700 transition-all shadow-sm hover:shadow"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600' 
                    : 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-0.5'
                )}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <div className="w-full h-full rounded-md bg-white flex items-center justify-center">
                      <img 
                        src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                        alt="AI" 
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Message bubble */}
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                    : 'bg-white/90 backdrop-blur-sm border border-gray-100 text-gray-900'
                )}>
                  <div className={cn(
                    "prose prose-sm max-w-none",
                    message.role === 'user' && 'prose-invert'
                  )}>
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({children}) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="mb-0.5">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                        code: ({children}) => <code className="bg-gray-200/50 px-1 py-0.5 rounded text-sm">{children}</code>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  <p className={cn(
                    "text-[10px] mt-2",
                    message.role === 'user' ? 'text-purple-200' : 'text-gray-400'
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {(isLoading || streamingContent) && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-0.5 flex-shrink-0">
                  <div className="w-full h-full rounded-md bg-white flex items-center justify-center">
                    <img 
                      src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                      alt="AI" 
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                </div>
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm">
                  {streamingContent ? (
                    <div className="prose prose-sm max-w-none text-gray-900">
                      <ReactMarkdown
                        components={{
                          p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="mb-0.5">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                        }}
                      >
                        {streamingContent}
                      </ReactMarkdown>
                      <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-0.5" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* More suggestions (after conversation started) */}
      {!showHistory && messages.length > 0 && !isLoading && (
        <div className="px-4 md:px-6 py-2 border-t border-gray-100 bg-white/50">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-full text-gray-600 hover:text-purple-700 transition-all whitespace-nowrap flex-shrink-0"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      {!showHistory && (
      <div className="px-4 md:px-6 py-4 bg-white/80 backdrop-blur-xl border-t border-gray-100">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isListening ? "Listening... speak now" : `Ask me anything about your ${userRole === 'teacher' ? 'teaching' : 'learning'}...`}
            className={cn(
              "flex-1 min-h-[44px] max-h-32 resize-none rounded-xl border-gray-200 bg-gray-50/50 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-400",
              isListening && "border-red-300 bg-red-50/50 placeholder:text-red-400"
            )}
            disabled={isLoading}
            rows={1}
          />
          <Button
            onClick={toggleVoiceInput}
            disabled={isLoading}
            variant="outline"
            className={cn(
              "h-11 w-11 rounded-xl transition-all",
              isListening 
                ? "bg-red-500 hover:bg-red-600 border-red-500 text-white animate-pulse" 
                : "border-gray-200 hover:border-purple-400 hover:bg-purple-50"
            )}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5 text-gray-600" />
            )}
          </Button>
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line • Click mic for voice input
        </p>
      </div>
      )}
    </Card>
  );
};

export default SmartAssistant;
