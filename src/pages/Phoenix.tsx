import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CollaborativeWhiteboard } from '@/components/phoenix/CollaborativeWhiteboard';
import { usePhoenixVoice } from '@/hooks/usePhoenixVoice';
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
  Trash2
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { isRecording, isProcessing, startRecording, stopRecording, speakText } = usePhoenixVoice();
  
  const [sessions, setSessions] = useState<PhoenixSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [whiteboardState, setWhiteboardState] = useState<any>(null);
  const [aiDrawCommands, setAiDrawCommands] = useState<any[]>([]);
  
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const recognitionTimeoutRef = useRef<any>(null);

  useEffect(() => {
    fetchSessions();
  }, [user?.id]);

  useEffect(() => {
    if (currentSessionId && isConnected) {
      loadSessionData(currentSessionId);
      
      // Set up realtime subscription for session updates
      const channel = supabase
        .channel(`phoenix-session-${currentSessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'phoenix_sessions',
            filter: `id=eq.${currentSessionId}`
          },
          (payload) => {
            console.log('[PHOENIX] Session updated:', payload);
            if (payload.new.session_transcript) {
              setTranscript(payload.new.session_transcript);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentSessionId, isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [transcript]);

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      }
      if (data.whiteboard_state) {
        setWhiteboardState(data.whiteboard_state);
      }
    } catch (error: any) {
      console.error('[PHOENIX] Error loading session:', error);
    }
  };

  const createNewSession = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('phoenix_sessions')
        .insert([{
          user_id: user.id,
          title: 'New Session',
          session_transcript: [] as any,
          whiteboard_state: {} as any
        }])
        .select()
        .single();

      if (error) throw error;
      
      setSessions([data as PhoenixSession, ...sessions]);
      setCurrentSessionId(data.id);
      setIsConnected(true);
      setTranscript([]);
      
      // Add welcome message
      const welcomeMessage: TranscriptMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: "Hello! I'm Phoenix, your AI teaching assistant. I can see and interact with the whiteboard. What would you like to learn today?",
        timestamp: new Date()
      };
      
      handleNewMessage(welcomeMessage);
      
      if (!isMuted) {
        await speakText(welcomeMessage.content);
      }
      
      toast({
        title: "Session started",
        description: "Phoenix is ready to help you learn!",
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
        setIsConnected(false);
        setTranscript([]);
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

  const handleEndSession = () => {
    setIsConnected(false);
    setIsAiThinking(false);
    setIsSpeaking(false);
    toast({
      title: "Session ended",
      description: "Session saved. You can resume it anytime!",
    });
  };

  const handleNewMessage = async (message: TranscriptMessage) => {
    const updatedTranscript = [...transcript, message];
    setTranscript(updatedTranscript);
    
    // Save to database
    if (currentSessionId) {
      await supabase
        .from('phoenix_sessions')
        .update({
          session_transcript: updatedTranscript as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSessionId);
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      // Stop recording and process
      const transcribedText = await stopRecording();
      if (transcribedText) {
        await sendMessage(transcribedText);
      }
    } else {
      // Start recording
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
      
      await startRecording();
      
      // Auto-stop after 30 seconds
      recognitionTimeoutRef.current = setTimeout(async () => {
        if (isRecording) {
          const transcribedText = await stopRecording();
          if (transcribedText) {
            await sendMessage(transcribedText);
          }
        }
      }, 30000);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim() || isAiThinking) return;
    
    const userMessage = textInput.trim();
    setTextInput('');
    await sendMessage(userMessage);
  };

  const sendMessage = async (content: string) => {
    if (!currentSessionId || !content.trim()) return;

    // Add user message
    const userMessage: TranscriptMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    await handleNewMessage(userMessage);
    
    // Get AI response
    setIsAiThinking(true);
    
    try {
      const messages = [
        ...transcript.slice(-10).map(t => ({
          role: t.role,
          content: t.content
        })),
        { role: 'user', content }
      ];

      console.log('[PHOENIX] Sending to AI tutor...');
      
      const { data, error } = await supabase.functions.invoke('phoenix-ai-tutor', {
        body: {
          messages,
          whiteboardState,
          transcript: transcript.slice(-10)
        }
      });

      if (error) throw error;

      // Add AI response
      const aiMessage: TranscriptMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      await handleNewMessage(aiMessage);

      // Handle whiteboard actions
      if (data.whiteboardAction) {
        console.log('[PHOENIX] Executing whiteboard action:', data.whiteboardAction);
        setAiDrawCommands(prev => [...prev, data.whiteboardAction]);
      }

      // Speak the response if not muted
      if (!isMuted) {
        setIsSpeaking(true);
        // Remove markdown and special characters for TTS
        const cleanText = data.response
          .replace(/[#*`_~]/g, '')
          .replace(/\n+/g, ' ')
          .substring(0, 500); // Limit length for TTS
        
        await speakText(cleanText);
        setIsSpeaking(false);
      }
    } catch (error: any) {
      console.error('[PHOENIX] Error getting AI response:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get AI response',
        variant: 'destructive'
      });
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleWhiteboardChange = async (state: any) => {
    setWhiteboardState(state);
    
    // Debounced save to database
    if (currentSessionId) {
      await supabase
        .from('phoenix_sessions')
        .update({
          whiteboard_state: state as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSessionId);
    }
  };

  return (
    <DashboardLayout userRole="learner">
      <div className="flex h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 overflow-hidden">
        {/* Left Sidebar - Sessions & Transcript */}
        <div className="w-72 bg-white/60 backdrop-blur-xl border-r border-gray-200 flex flex-col shadow-xl">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Phoenix
                </h1>
                <p className="text-xs text-muted-foreground">AI Teaching Assistant</p>
              </div>
            </div>
            
            <Button
              onClick={createNewSession}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white mb-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
            
            {isConnected && (
              <Button
                onClick={handleEndSession}
                variant="outline"
                className="w-full border-gray-300"
              >
                End Session
              </Button>
            )}
          </div>

          {/* Sessions List */}
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Your Sessions</h3>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {sessions.map((session) => (
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
                    setIsConnected(true);
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
              ))}
            </div>
          </ScrollArea>

          {/* Transcript */}
          {isConnected && (
            <>
              <div className="px-4 py-2 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Transcript</h3>
              </div>
              <ScrollArea className="flex-1 p-4 border-t border-gray-200">
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
                  {isAiThinking && (
                    <div className="flex justify-start">
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3">
                        <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                      </div>
                    </div>
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Center - Interactive Whiteboard */}
        <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-sm min-w-0">
          <div className="flex-1 p-4">
            {!isConnected ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-8 shadow-2xl animate-pulse">
                  <Sparkles className="h-16 w-16 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Meet Phoenix
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mb-8">
                  Your AI-powered teaching assistant with vision, voice, and collaborative whiteboard capabilities. 
                  Phoenix can see what you draw, hear what you say, and teach you interactively in real-time.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                  <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-orange-200">
                    <div className="text-4xl mb-3">🎤</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Voice Interaction</h3>
                    <p className="text-sm text-gray-600">
                      Speak naturally with Phoenix using real-time voice communication
                    </p>
                  </Card>
                  <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-red-200">
                    <div className="text-4xl mb-3">✏️</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Collaborative Board</h3>
                    <p className="text-sm text-gray-600">
                      Draw, write, and solve problems together on a shared whiteboard
                    </p>
                  </Card>
                  <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-purple-200">
                    <div className="text-4xl mb-3">👁️</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Visual Understanding</h3>
                    <p className="text-sm text-gray-600">
                      Phoenix can see and understand everything on the whiteboard
                    </p>
                  </Card>
                </div>
              </div>
            ) : (
              <CollaborativeWhiteboard
                sessionId={currentSessionId!}
                onStateChange={handleWhiteboardChange}
                aiDrawCommands={aiDrawCommands}
              />
            )}
          </div>

          {/* Input Area */}
          {isConnected && (
            <div className="p-4 border-t border-gray-200 bg-white/60 backdrop-blur-xl">
              <div className="flex items-end space-x-2">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit();
                    }
                  }}
                  placeholder="Type your question or use voice..."
                  className="flex-1 min-h-[60px] max-h-[120px] border-2 border-gray-300 focus:border-orange-500 rounded-xl resize-none"
                  disabled={isAiThinking}
                />
                <Button
                  onClick={handleTextSubmit}
                  disabled={isAiThinking || !textInput.trim()}
                  className="h-[60px] bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  <Send className="h-5 w-5 text-white" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Voice Controls */}
        <div className="w-64 bg-white/60 backdrop-blur-xl border-l border-gray-200 flex flex-col shadow-xl">
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-4">Voice Controls</h3>
            
            <div className="space-y-3">
              {/* Voice Status */}
              <Card className={cn(
                "p-3 transition-all",
                isRecording ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300" : "bg-gray-50"
              )}>
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isRecording ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  )} />
                  <p className="text-sm font-medium">
                    {isRecording ? "Listening..." : isProcessing ? "Processing..." : "Microphone Off"}
                  </p>
                </div>
              </Card>

              {/* Speaker Status */}
              <Card className={cn(
                "p-3 transition-all",
                isSpeaking ? "bg-gradient-to-br from-orange-50 to-red-50 border-orange-300" : "bg-gray-50"
              )}>
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isSpeaking ? "bg-orange-500 animate-pulse" : "bg-gray-400"
                  )} />
                  <p className="text-sm font-medium">
                    {isSpeaking ? "Phoenix Speaking..." : "Phoenix Silent"}
                  </p>
                </div>
              </Card>

              {/* AI Status */}
              {isAiThinking && (
                <Card className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <p className="text-sm font-medium">Phoenix is thinking...</p>
                  </div>
                </Card>
              )}

              {/* Microphone Toggle */}
              <Button
                onClick={handleVoiceInput}
                disabled={!isConnected || isProcessing || isAiThinking}
                className={cn(
                  "w-full h-14 text-base font-semibold",
                  isRecording 
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                    : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
                )}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-5 w-5 mr-2" />
                    Stop Listening
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5 mr-2" />
                    Push to Talk
                  </>
                )}
              </Button>

              {/* Mute Toggle */}
              <Button
                onClick={() => setIsMuted(!isMuted)}
                disabled={!isConnected}
                variant="outline"
                className="w-full"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="h-5 w-5 mr-2" />
                    Unmute Phoenix
                  </>
                ) : (
                  <>
                    <Volume2 className="h-5 w-5 mr-2" />
                    Mute Phoenix
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-auto p-4 border-t border-gray-200">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                💡 Learning Tips
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Hold the mic button to speak</li>
                <li>• Draw on the whiteboard</li>
                <li>• Phoenix can see your drawings</li>
                <li>• Ask for step-by-step explanations</li>
                <li>• Request examples when confused</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Phoenix;
