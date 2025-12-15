import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Sparkles, User, Loader2, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = userRole === 'teacher' ? TEACHER_SUGGESTIONS : STUDENT_SUGGESTIONS;
  const assistantName = userRole === 'teacher' ? 'Teaching Assistant' : 'Learning Assistant';
  const userName = profile?.first_name || 'there';

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {assistantName}
            </h2>
            <p className="text-xs text-gray-500">
              Powered by AI • Full context access
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600"
        >
          {isExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 md:px-6 py-4">
        {messages.length === 0 && !streamingContent ? (
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
      {messages.length > 0 && !isLoading && (
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
      <div className="px-4 md:px-6 py-4 bg-white/80 backdrop-blur-xl border-t border-gray-100">
        <div className="flex gap-3 items-end">
          <Textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Ask me anything about your ${userRole === 'teacher' ? 'teaching' : 'learning'}...`}
            className="flex-1 min-h-[44px] max-h-32 resize-none rounded-xl border-gray-200 bg-gray-50/50 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-400"
            disabled={isLoading}
            rows={1}
          />
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
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
};

export default SmartAssistant;
