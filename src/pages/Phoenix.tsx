import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PhoenixWhiteboard, PhoenixWhiteboardRef } from '@/components/phoenix/PhoenixWhiteboard';
import { usePhoenixRealtime, WhiteboardAction } from '@/hooks/usePhoenixRealtime';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Lock,
  MessageSquare,
  Keyboard,
  Edit2,
  Check,
  X,
  StopCircle,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { normalizeMathDelimiters, latexToVisualUnicode } from '@/utils/phoenixMathUtils';
import jsPDF from 'jspdf';

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
  whiteboard_state?: any;
  session_transcript?: any;
}

// Helper to get current whiteboard state synchronously
const getCurrentWhiteboardState = (ref: React.RefObject<PhoenixWhiteboardRef | null>): any => {
  try {
    return ref.current?.getState() || {};
  } catch {
    return {};
  }
};

const Phoenix: React.FC = () => {
  const { user, subscription, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const whiteboardRef = useRef<PhoenixWhiteboardRef>(null);
  
  const [sessions, setSessions] = useState<PhoenixSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  // Mode states
  const [isTextMode, setIsTextMode] = useState(false);
  const [isTextLoading, setIsTextLoading] = useState(false);
  
  // Track if Phoenix has active whiteboard session
  const [isPhoenixActive, setIsPhoenixActive] = useState(false);
  
  // Session rename state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Transcript panel visibility
  const [showTranscript, setShowTranscript] = useState(true);
  
  // Abort controller for text mode cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const whiteboardActionTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Check if user has Learn+ subscription
  const hasLearnPlus = subscription?.tier === 'student_premium' && subscription?.subscribed;

  // Realtime voice hook
  const {
    isConnected,
    isConnecting,
    isSpeaking,
    isListening,
    connect,
    disconnect,
    stop: stopVoice,
    sendTextMessage: sendVoiceTextMessage,
    sendScreenshot,
    sendWhiteboardContext
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

  // Phoenix is "active" when either connected via voice OR in text mode with a session
  useEffect(() => {
    setIsPhoenixActive(isConnected || (isTextMode && currentSessionId !== null));
  }, [isConnected, isTextMode, currentSessionId]);

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
    } else {
      // Clear whiteboard when no session
      whiteboardRef.current?.clear();
      setTranscript([]);
    }
  }, [currentSessionId]);

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  function handleWhiteboardAction(action: WhiteboardAction) {
    console.log('[PHOENIX] Whiteboard action:', action);
    
    if (action.type === 'capture_screenshot') {
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
      // Instead of sending screenshot (not supported), send whiteboard layout as text context
      const layout = whiteboardRef.current.getWhiteboardLayout();
      let contextText = `[Whiteboard analysis requested: ${reason}]\n`;
      contextText += `Canvas: ${layout.canvasWidth}x${layout.canvasHeight}px, ${layout.items.length} objects.\n`;
      
      if (layout.items.length > 0) {
        contextText += 'Objects on whiteboard:\n';
        layout.items.slice(0, 10).forEach((item, i) => {
          const textPreview = item.text ? ` "${item.text}"` : '';
          contextText += `  ${i + 1}. ${item.type} at (${item.left}, ${item.top})${textPreview}\n`;
        });
      } else {
        contextText += 'The whiteboard is currently empty.';
      }
      
      sendWhiteboardContext(contextText);
    } catch (error) {
      console.error('[PHOENIX] Whiteboard context error:', error);
    }
  }, [sendWhiteboardContext]);

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
      
      // Load transcript
      if (data.session_transcript && Array.isArray(data.session_transcript)) {
        setTranscript(data.session_transcript as any as TranscriptMessage[]);
      } else {
        setTranscript([]);
      }
      
      // Clear then load whiteboard state
      whiteboardRef.current?.clear();
      if (data.whiteboard_state && Object.keys(data.whiteboard_state).length > 0) {
        // Small delay to ensure clear completes
        setTimeout(() => {
          whiteboardRef.current?.loadState(data.whiteboard_state);
        }, 100);
      }
      
      console.log('[PHOENIX] Session loaded:', sessionId);
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

  const saveWhiteboardState = useCallback(async (state: any) => {
    if (!currentSessionId) return;
    
    await supabase
      .from('phoenix_sessions')
      .update({
        whiteboard_state: state as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSessionId);
  }, [currentSessionId]);

  // Flush current session state to DB (call before switching/creating sessions)
  const flushCurrentSession = useCallback(async () => {
    if (!currentSessionId) return;
    
    const whiteboardState = getCurrentWhiteboardState(whiteboardRef);
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
      session_transcript: transcript as any
    };
    
    // Always save whiteboard state
    if (whiteboardState && Object.keys(whiteboardState).length > 0) {
      updateData.whiteboard_state = whiteboardState;
    }
    
    console.log('[PHOENIX] Flushing session:', currentSessionId, 
      'whiteboard objects:', whiteboardState?.objects?.length || 0,
      'transcript messages:', transcript.length);
    
    await supabase
      .from('phoenix_sessions')
      .update(updateData)
      .eq('id', currentSessionId);
  }, [currentSessionId, transcript]);

  const createNewSession = async () => {
    if (!user?.id) return;
    
    try {
      // IMPORTANT: Save current session before creating new one
      await flushCurrentSession();
      
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
      whiteboardRef.current?.clear();
      
      toast({
        title: "New session created",
        description: isTextMode ? "Start typing to chat with Phoenix!" : "Connect to Phoenix to start learning!",
      });
    } catch (error: any) {
      toast({
        title: 'Error creating session',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const renameSession = async (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from('phoenix_sessions')
        .update({ title: newTitle.trim(), updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(sessions.map(s => 
        s.id === sessionId ? { ...s, title: newTitle.trim() } : s
      ));
      setEditingSessionId(null);
      setEditingTitle('');
      
      toast({ title: 'Session renamed' });
    } catch (error: any) {
      toast({
        title: 'Error renaming session',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const startEditingSession = (session: PhoenixSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const cancelEditingSession = () => {
    setEditingSessionId(null);
    setEditingTitle('');
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
        whiteboardRef.current?.clear();
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
    
    // After connection, inject session context to voice mode WITHOUT triggering a response
    // This primes the model with conversation history so it doesn't ask "what problem..."
    setTimeout(() => {
      if (transcript.length > 0 || whiteboardRef.current) {
        // Build context summary for voice mode
        let contextSummary = '[CONTEXT INJECTION - DO NOT RESPOND TO THIS, just absorb the context]\n';
        contextSummary += 'You are continuing an existing session. The student has already started working with you.\n';
        
        // Add transcript summary (last few messages)
        if (transcript.length > 0) {
          const recentMessages = transcript.slice(-5);
          contextSummary += 'Recent conversation:\n';
          recentMessages.forEach(msg => {
            const role = msg.role === 'user' ? 'Student' : 'Phoenix';
            const preview = msg.content.substring(0, 150) + (msg.content.length > 150 ? '...' : '');
            contextSummary += `  ${role}: ${preview}\n`;
          });
        }
        
        // Add whiteboard summary
        const layout = whiteboardRef.current?.getWhiteboardLayout();
        if (layout && layout.items.length > 0) {
          contextSummary += `\nWhiteboard has ${layout.items.length} objects. `;
          const textItems = layout.items.filter(i => i.text);
          if (textItems.length > 0) {
            contextSummary += 'Text on board: ' + textItems.map(i => `"${i.text}"`).slice(0, 3).join(', ');
          }
        }
        
        if (transcript.length > 0 || (layout && layout.items.length > 0)) {
          // Pass false to NOT trigger a response - just inject context silently
          sendWhiteboardContext(contextSummary, false);
        }
      }
    }, 1500);
  };

  // Stop Phoenix (voice or text mode)
  const handleStop = useCallback(() => {
    if (isTextMode) {
      // Cancel text mode request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      // Cancel any pending whiteboard action timeouts
      whiteboardActionTimeoutsRef.current.forEach(t => clearTimeout(t));
      whiteboardActionTimeoutsRef.current = [];
      setIsTextLoading(false);
      toast({
        title: "Phoenix stopped",
        description: "Ready for your next question",
      });
    } else if (isConnected) {
      // Stop voice mode
      stopVoice();
    }
  }, [isTextMode, isConnected, stopVoice, toast]);

  // Execute whiteboard actions from text mode response
  const executeWhiteboardActions = useCallback((actions: WhiteboardAction[]) => {
    if (!whiteboardRef.current || !actions || actions.length === 0) return;
    
    console.log('[PHOENIX] Executing text-mode whiteboard actions:', actions);
    
    // Clear previous timeouts
    whiteboardActionTimeoutsRef.current.forEach(t => clearTimeout(t));
    whiteboardActionTimeoutsRef.current = [];
    
    // Execute actions with small delays for visual effect
    actions.forEach((action, index) => {
      const timeout = setTimeout(() => {
        handleWhiteboardAction(action);
      }, index * 300);
      whiteboardActionTimeoutsRef.current.push(timeout);
    });
  }, []);

  // Send text message via Lovable AI (text mode)
  const sendTextModeMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message to transcript
    const userMessage: TranscriptMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    const updatedTranscript = [...transcript, userMessage];
    setTranscript(updatedTranscript);
    setIsTextLoading(true);
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      // Get whiteboard layout for context
      const whiteboardContext = whiteboardRef.current?.getWhiteboardLayout() || null;
      
      // Build message history for context
      const messageHistory = updatedTranscript.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const response = await supabase.functions.invoke('phoenix-text-chat', {
        body: { 
          messages: messageHistory, 
          includeWhiteboardActions: true,
          whiteboardContext,
          fullTranscript: updatedTranscript.map(m => ({ role: m.role, content: m.content }))
        }
      });
      
      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        console.log('[PHOENIX] Request was aborted');
        return;
      }
      
      if (response.error) throw response.error;
      
      const assistantMessage: TranscriptMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.data.content || 'I apologize, I couldn\'t generate a response.',
        timestamp: new Date()
      };
      
      const finalTranscript = [...updatedTranscript, assistantMessage];
      setTranscript(finalTranscript);
      
      // Execute any whiteboard actions from the response
      if (response.data.whiteboardActions && response.data.whiteboardActions.length > 0) {
        executeWhiteboardActions(response.data.whiteboardActions);
      }
      
      // Save to database
      if (currentSessionId) {
        saveTranscript(finalTranscript);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[PHOENIX] Request aborted');
        return;
      }
      console.error('[PHOENIX] Text mode error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get response from Phoenix',
        variant: 'destructive'
      });
    } finally {
      setIsTextLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    
    const text = textInput.trim();
    setTextInput('');
    
    if (isTextMode) {
      // Ensure we have a session
      if (!currentSessionId) {
        await createNewSession();
      }
      await sendTextModeMessage(text);
    } else if (isConnected) {
      // Voice mode - send via WebRTC
      sendVoiceTextMessage(text);
    }
  };

  // Toggle text mode
  const handleModeToggle = async (checked: boolean) => {
    // Save session state before mode change
    await flushCurrentSession();
    
    setIsTextMode(checked);
    
    // Disconnect voice if switching to text mode
    if (checked && isConnected) {
      disconnect();
    }
    
    toast({
      title: checked ? 'Text Mode Enabled' : 'Voice Mode Enabled',
      description: checked 
        ? 'Phoenix will respond with formatted text and use the whiteboard' 
        : 'Connect to speak with Phoenix in real-time',
    });
  };

  // Handle session switch
  const handleSessionSwitch = async (sessionId: string) => {
    if (editingSessionId === sessionId) return;
    if (sessionId === currentSessionId) return; // Already on this session
    
    // IMPORTANT: Save current session before switching
    await flushCurrentSession();
    
    // Disconnect voice if connected
    if (isConnected) {
      disconnect();
    }
    
    // Cancel any pending text requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    whiteboardActionTimeoutsRef.current.forEach(t => clearTimeout(t));
    whiteboardActionTimeoutsRef.current = [];
    setIsTextLoading(false);
    
    setCurrentSessionId(sessionId);
  };

  // Check if stop button should be shown
  const showStopButton = (isConnected && isSpeaking) || isTextLoading;

  // Export transcript as PDF with proper math rendering
  const exportTranscriptPDF = useCallback(() => {
    if (transcript.length === 0) {
      toast({ title: 'No transcript to export', variant: 'destructive' });
      return;
    }
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPos = 20;
    
    // Title
    const session = sessions.find(s => s.id === currentSessionId);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(session?.title || 'Phoenix Session', margin, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Exported: ${new Date().toLocaleString()}`, margin, yPos);
    yPos += 15;
    
    // Transcript messages
    transcript.forEach((msg) => {
      // Check if we need a new page
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
      
      // Role header
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      if (msg.role === 'assistant') {
        pdf.setTextColor(234, 88, 12);
      } else {
        pdf.setTextColor(59, 130, 246);
      }
      pdf.text(msg.role === 'assistant' ? 'Phoenix' : 'You', margin, yPos);
      yPos += 6;
      
      // Content - convert LaTeX to visual Unicode for PDF
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      // Process content: normalize math and convert to visual characters
      let content = normalizeMathDelimiters(msg.content);
      // Convert remaining LaTeX to Unicode for PDF display
      content = latexToVisualUnicode(content);
      // Remove markdown formatting for clean PDF
      content = content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
      
      const lines = pdf.splitTextToSize(content, maxWidth);
      lines.forEach((line: string) => {
        if (yPos > 280) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(line, margin, yPos);
        yPos += 5;
      });
      
      yPos += 8;
    });
    
    pdf.save(`phoenix-session-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: 'Transcript exported as PDF' });
  }, [transcript, sessions, currentSessionId, toast]);

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

            {/* Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-3">
              <div className="flex items-center gap-2">
                {isTextMode ? (
                  <Keyboard className="h-4 w-4 text-blue-600" />
                ) : (
                  <Mic className="h-4 w-4 text-orange-600" />
                )}
                <Label htmlFor="text-mode" className="text-sm font-medium">
                  {isTextMode ? 'Text Responses' : 'Voice Responses'}
                </Label>
              </div>
              <Switch
                id="text-mode"
                checked={isTextMode}
                onCheckedChange={handleModeToggle}
              />
            </div>
            <p className="text-xs text-muted-foreground mb-3 px-1">
              {isTextMode 
                ? 'Phoenix responds with text & uses whiteboard autonomously'
                : 'Phoenix speaks & uses whiteboard in real-time'}
            </p>

            {/* Connection Controls */}
            <div className="space-y-2">
              {!isTextMode ? (
                // Voice mode controls
                !isConnected ? (
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
                  <div className="space-y-2">
                    <Button
                      onClick={disconnect}
                      variant="destructive"
                      className="w-full"
                    >
                      <PhoneOff className="h-4 w-4 mr-2" />
                      End Session
                    </Button>
                  </div>
                )
              ) : (
                // Text mode - show active state
                <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-blue-800">Phoenix ready (Text Mode)</span>
                  </div>
                </div>
              )}

              {/* Stop Button - shows when Phoenix is speaking or loading */}
              {showStopButton && (
                <Button
                  onClick={handleStop}
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop Phoenix
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
          {isConnected && !isTextMode && (
            <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isSpeaking ? "bg-orange-500 animate-pulse" : isListening ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                )} />
                <span className="text-sm font-medium text-green-800">
                  {isSpeaking ? "Phoenix is speaking..." : isListening ? "Phoenix is listening... (speak now!)" : "Processing..."}
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
                      onClick={() => handleSessionSwitch(session.id)}
                    >
                      <div className="flex-1 min-w-0">
                        {editingSessionId === session.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="h-7 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  renameSession(session.id, editingTitle);
                                } else if (e.key === 'Escape') {
                                  cancelEditingSession();
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => renameSession(session.id, editingTitle)}
                            >
                              <Check className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={cancelEditingSession}
                            >
                              <X className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {session.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(session.updated_at).toLocaleDateString()}
                            </p>
                          </>
                        )}
                      </div>
                      {editingSessionId !== session.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingSession(session);
                            }}
                          >
                            <Edit2 className="h-3 w-3 text-gray-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      )}
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
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {normalizeMathDelimiters(msg.content)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isTextLoading && (
                    <div className="p-3 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200">
                      <p className="font-medium text-xs mb-1">Phoenix</p>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  )}
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
                isConnected={isPhoenixActive}
                onStateChange={(state) => {
                  // Save whiteboard state to current session
                  saveWhiteboardState(state);
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

          {/* Text Input - Always show when there's a session */}
          {currentSessionId && (isConnected || isTextMode) && (
            <div className="p-4 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={isTextMode 
                    ? "Type your question... (Phoenix will respond with text and draw on whiteboard)" 
                    : "Type a message (or just speak!)..."
                  }
                  className="resize-none"
                  rows={1}
                  disabled={isTextLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit();
                    }
                  }}
                />
                <Button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || isTextLoading}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  {isTextLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                {isTextMode 
                  ? "Text mode: Phoenix responds with formatted text and uses the whiteboard autonomously"
                  : "Phoenix is listening. Speak naturally or type your questions."
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Phoenix;