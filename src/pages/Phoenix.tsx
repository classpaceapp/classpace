import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Loader2,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Phoenix: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleStartSession = () => {
    setIsConnected(true);
    setTranscript(prev => [...prev, "Phoenix: Hello! I'm Phoenix, your AI teaching assistant. I can see and interact with the whiteboard. What would you like to learn today?"]);
    toast({
      title: "Session started",
      description: "Phoenix is ready to help you learn!",
    });
  };

  const handleEndSession = () => {
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setTranscript([]);
    toast({
      title: "Session ended",
      description: "Thanks for learning with Phoenix!",
    });
  };

  const toggleMicrophone = () => {
    if (!isConnected) {
      toast({
        title: "Not connected",
        description: "Please start a session first",
        variant: "destructive",
      });
      return;
    }
    setIsListening(!isListening);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <DashboardLayout userRole="learner">
      <div className="flex h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
        {/* Left Sidebar - Context & Transcript */}
        <div className="w-80 bg-white/60 backdrop-blur-xl border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center animate-pulse">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Phoenix
                </h1>
                <p className="text-xs text-muted-foreground">AI Teaching Assistant</p>
              </div>
            </div>
            
            {!isConnected ? (
              <Button
                onClick={handleStartSession}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
              >
                Start Learning Session
              </Button>
            ) : (
              <Button
                onClick={handleEndSession}
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
              >
                End Session
              </Button>
            )}
          </div>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Session Transcript</h3>
            <div className="space-y-3">
              {transcript.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Start a session to begin learning
                </p>
              ) : (
                transcript.map((text, idx) => {
                  const isPhoenix = text.startsWith('Phoenix:');
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg text-sm",
                        isPhoenix 
                          ? "bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200" 
                          : "bg-blue-50 border border-blue-200"
                      )}
                    >
                      <p className="font-medium text-xs mb-1">
                        {isPhoenix ? "Phoenix" : "You"}
                      </p>
                      <p className="text-gray-800">{text.replace(/^(Phoenix:|You:)\s*/, '')}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Center - Interactive Whiteboard */}
        <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-sm">
          <div className="flex-1 p-6">
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
              <div className="h-full rounded-2xl border-2 border-gray-300 bg-white shadow-lg overflow-hidden">
                <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-600 font-medium">Interactive Whiteboard</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Full collaborative canvas coming soon
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Voice Controls */}
        <div className="w-80 bg-white/60 backdrop-blur-xl border-l border-gray-200 flex flex-col">
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">Voice Controls</h3>
            
            <div className="space-y-4">
              {/* Voice Status */}
              <Card className={cn(
                "p-4 transition-all",
                isListening ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300" : "bg-gray-50"
              )}>
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    isListening ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  )} />
                  <p className="text-sm font-medium">
                    {isListening ? "Listening..." : "Microphone Off"}
                  </p>
                </div>
              </Card>

              {/* Speaker Status */}
              <Card className={cn(
                "p-4 transition-all",
                isSpeaking ? "bg-gradient-to-br from-orange-50 to-red-50 border-orange-300" : "bg-gray-50"
              )}>
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    isSpeaking ? "bg-orange-500 animate-pulse" : "bg-gray-400"
                  )} />
                  <p className="text-sm font-medium">
                    {isSpeaking ? "Phoenix Speaking..." : "Phoenix Silent"}
                  </p>
                </div>
              </Card>

              {/* Microphone Toggle */}
              <Button
                onClick={toggleMicrophone}
                disabled={!isConnected}
                className={cn(
                  "w-full h-16",
                  isListening 
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                    : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600"
                )}
              >
                {isListening ? (
                  <>
                    <Mic className="h-6 w-6 mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <MicOff className="h-6 w-6 mr-2" />
                    Start Listening
                  </>
                )}
              </Button>

              {/* Mute Toggle */}
              <Button
                onClick={toggleMute}
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

          {/* Info Section */}
          <div className="mt-auto p-6 border-t border-gray-200">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                💡 Tips for Learning
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Speak clearly and naturally</li>
                <li>• Draw diagrams to visualize concepts</li>
                <li>• Ask Phoenix to explain step-by-step</li>
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
