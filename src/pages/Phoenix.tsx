import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PhoenixWhiteboard, PhoenixWhiteboardRef } from '@/components/phoenix/PhoenixWhiteboard';
import { usePhoenixRealtime, WhiteboardAction } from '@/hooks/usePhoenixRealtime';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Loader2,
  Sparkles,
  Volume2,
  VolumeX,
  Send,
  Plus,
  Trash2,
  Phone,
  PhoneOff,
  Zap,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PhoenixSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const Phoenix: React.FC = () => {
  const { user, subscription, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const whiteboardRef = useRef<PhoenixWhiteboardRef>(null);
  
  const [sessions, setSessions] = useState<PhoenixSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Check if user has Learn+ subscription
  const hasLearnPlus = subscription?.tier === 'student_premium' && subscription?.subscribed;

  // Realtime voice hook
  const {
    isConnected,
    isConnecting,
    isSpeaking,
    connect,
    disconnect,
    sendTextMessage,
    sendScreenshot
  } = usePhoenixRealtime({
    onWhiteboardAction: handleWhiteboardAction,
    onTranscript: handleTranscript,
    onSpeakingChange: (speaking) => {
      // Could update UI for speaking indicator
    },
    onError: (error) => {
      toast({
        title: 'Phoenix Error',
        description: error,
        variant: 'destructive'
      });
    }
  });

  useEffect(() => {
    if (user?.id && hasLearnPlus) {
      fetchSessions();
    }
  }, [user?.id, hasLearnPlus]);

  useEffect(() => {
    scrollToBottom();
  }, [transcript]);

  useEffect(() => {
    // Load session data when session changes
    if (currentSessionId) {
      loadSessionData(currentSessionId);
    }
  }, [currentSessionId]);

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  function handleWhiteboardAction(action: WhiteboardAction) {
    console.log('[PHOENIX] Whiteboard action:', action);
    
    if (action.type === 'capture_screenshot') {
      // Capture and send screenshot to AI
      captureAndSendScreenshot(action.params.reason || 'Student requested analysis');
    } else {
      whiteboardRef.current?.executeAction(action);
    }
  }

  function handleTranscript(text: string, role: 'user' | 'assistant') {
    const message: TranscriptMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role,
      content: text,
      timestamp: new Date()
    };
    
    setTranscript(prev => [...prev, message]);
    
    // Save to database
    if (currentSessionId) {
      saveTranscript([...transcript, message]);
    }
  }

  const captureAndSendScreenshot = useCallback(async (reason: string) => {
    if (!whiteboardRef.current) return;
    
    try {
      const screenshot = await whiteboardRef.current.captureScreenshot();
      if (screenshot) {
        sendScreenshot(screenshot, reason);
      }
    } catch (error) {
      console.error('[PHOENIX] Screenshot error:', error);
    }
  }, [sendScreenshot]);

  const fetchSessions = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('phoenix_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions((data || []) as PhoenixSession[]);
    } catch (error: any) {
      console.error('[PHOENIX] Error fetching sessions:', error);
    }
  };

  const loadSessionData = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('phoenix_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      
      if (data.session_transcript && Array.isArray(data.session_transcript)) {
        setTranscript(data.session_transcript as any as TranscriptMessage[]);
      } else {
        setTranscript([]);
      }
    } catch (error: any) {
      console.error('[PHOENIX] Error loading session:', error);
    }
  };

  const saveTranscript = async (messages: TranscriptMessage[]) => {
    if (!currentSessionId) return;
    
    await supabase
      .from('phoenix_sessions')
      .update({
        session_transcript: messages as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSessionId);
  };

  const createNewSession = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('phoenix_sessions')
        .insert([{
          user_id: user.id,
          title: `Session ${new Date().toLocaleDateString()}`,
          session_transcript: [] as any,
          whiteboard_state: {} as any
        }])
        .select()
        .single();

      if (error) throw error;
      
      setSessions([data as PhoenixSession, ...sessions]);
      setCurrentSessionId(data.id);
      setTranscript([]);
      
      toast({
        title: "New session created",
        description: "Connect to Phoenix to start learning!",
      });
    } catch (error: any) {
      toast({
        title: 'Error creating session',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('phoenix_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(sessions.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setTranscript([]);
        if (isConnected) disconnect();
      }
      
      toast({ title: 'Session deleted' });
    } catch (error: any) {
      toast({
        title: 'Error deleting session',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleConnect = async () => {
    if (!currentSessionId) {
      await createNewSession();
    }
    await connect();
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim() || !isConnected) return;
    
    const text = textInput.trim();
    setTextInput('');
    sendTextMessage(text);
  };

  // Render upgrade prompt for non-subscribers
  if (!hasLearnPlus) {
    return (
      <DashboardLayout userRole="learner">
        <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
          <Card className="max-w-lg p-8 text-center bg-white/80 backdrop-blur-xl border-2 border-orange-200 shadow-2xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Lock className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
              Phoenix AI Tutor
            </h2>
            <p className="text-muted-foreground mb-6">
              Phoenix is an advanced agentic AI tutor with real-time voice interaction and whiteboard control. 
              Available exclusively for Learn+ subscribers.
            </p>
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Zap className="h-5 w-5 text-orange-600" />
                <span className="text-sm">Real-time voice conversation</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Sparkles className="h-5 w-5 text-orange-600" />
                <span className="text-sm">AI-controlled whiteboard with visual teaching</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Volume2 className="h-5 w-5 text-orange-600" />
                <span className="text-sm">Phoenix can see and analyze your drawings</span>
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              onClick={() => window.location.href = '/my-plan'}
            >
              Upgrade to Learn+
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="learner">
      <div className="flex h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 overflow-hidden">
        {/* Left Sidebar - Sessions & Controls */}
        <div className="hidden md:flex w-80 bg-white/70 backdrop-blur-xl border-r border-gray-200 flex-col shadow-xl">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Phoenix AI
                </h1>
                <p className="text-xs text-muted-foreground">Agentic Teaching Assistant</p>
              </div>
            </div>

            {/* Connection Controls */}
            <div className="space-y-2">
              {!isConnected ? (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Connect to Phoenix
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={disconnect}
                  variant="destructive"
                  className="w-full"
                >
                  <PhoneOff className="h-4 w-4 mr-2" />
                  End Session
                </Button>
              )}

              <Button
                onClick={createNewSession}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </div>
          </div>

          {/* Status Indicator */}
          {isConnected && (
            <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isSpeaking ? "bg-orange-500 animate-pulse" : "bg-green-500"
                )} />
                <span className="text-sm font-medium text-green-800">
                  {isSpeaking ? "Phoenix is speaking..." : "Phoenix is listening..."}
                </span>
              </div>
            </div>
          )}

          {/* Sessions List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Your Sessions</h3>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sessions yet. Create one to start!
                  </p>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                        currentSessionId === session.id
                          ? "bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300"
                          : "hover:bg-gray-100/50 border border-transparent"
                      )}
                      onClick={() => {
                        setCurrentSessionId(session.id);
                        if (isConnected) disconnect();
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {session.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(session.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Transcript */}
          {currentSessionId && (
            <div className="flex-1 border-t border-gray-200 flex flex-col max-h-[40%]">
              <div className="px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Transcript</h3>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {transcript.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "p-3 rounded-lg text-sm",
                        msg.role === 'assistant'
                          ? "bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200"
                          : "bg-blue-50 border border-blue-200"
                      )}
                    >
                      <p className="font-medium text-xs mb-1">
                        {msg.role === 'assistant' ? 'Phoenix' : 'You'}
                      </p>
                      <div className="text-gray-800 prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Center - Whiteboard */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Whiteboard Area */}
          <div className="flex-1 p-4">
            {currentSessionId ? (
              <PhoenixWhiteboard
                ref={whiteboardRef}
                isConnected={isConnected}
                onStateChange={(state) => {
                  // Save whiteboard state
                  if (currentSessionId) {
                    supabase
                      .from('phoenix_sessions')
                      .update({ whiteboard_state: state as any })
                      .eq('id', currentSessionId);
                  }
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-8 shadow-2xl">
                  <Sparkles className="h-16 w-16 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to Phoenix
                </h2>
                <p className="text-lg text-muted-foreground max-w-md mb-8">
                  Your personal AI tutor with real-time voice and a shared whiteboard. 
                  Phoenix can draw, explain, and teach you anything.
                </p>
                <Button
                  onClick={createNewSession}
                  size="lg"
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Start a New Session
                </Button>
              </div>
            )}
          </div>

          {/* Text Input (fallback for when voice isn't working) */}
          {currentSessionId && isConnected && (
            <div className="p-4 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type a message (or just speak!)..."
                  className="resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit();
                    }
                  }}
                />
                <Button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim()}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Phoenix is listening. Speak naturally or type your questions.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Phoenix;
