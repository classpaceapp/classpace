import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WhiteboardAction {
  type: 'move_cursor' | 'draw_freehand' | 'draw_text' | 'draw_shape' | 'draw_equation' | 'highlight_area' | 'clear_whiteboard' | 'capture_screenshot';
  params: Record<string, any>;
}

interface UsePhoenixRealtimeProps {
  onWhiteboardAction?: (action: WhiteboardAction) => void;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  onSpeakingChange?: (speaking: boolean) => void;
  onError?: (error: string) => void;
}

export const usePhoenixRealtime = ({
  onWhiteboardAction,
  onTranscript,
  onSpeakingChange,
  onError
}: UsePhoenixRealtimeProps = {}) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Create audio element for AI voice playback
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioElRef.current = audioEl;
    
    return () => {
      disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;
    
    setIsConnecting(true);
    console.log('[PHOENIX-REALTIME] Starting connection...');

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      localStreamRef.current = stream;
      console.log('[PHOENIX-REALTIME] Microphone access granted');

      // Get ephemeral token from our edge function
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('phoenix-realtime-token', {
        body: {}
      });

      if (tokenError || !tokenData?.client_secret?.value) {
        throw new Error(tokenError?.message || 'Failed to get ephemeral token');
      }

      const ephemeralKey = tokenData.client_secret.value;
      console.log('[PHOENIX-REALTIME] Ephemeral token received');

      // Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Set up remote audio
      pc.ontrack = (e) => {
        console.log('[PHOENIX-REALTIME] Received remote track');
        if (audioElRef.current) {
          audioElRef.current.srcObject = e.streams[0];
        }
      };

      // Add local audio track
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Set up data channel for events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.addEventListener('open', () => {
        console.log('[PHOENIX-REALTIME] Data channel opened');
      });

      dc.addEventListener('message', (e) => {
        handleRealtimeEvent(JSON.parse(e.data));
      });

      // Create and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`WebRTC connection failed: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await pc.setRemoteDescription(answer);
      console.log('[PHOENIX-REALTIME] WebRTC connection established');

      setIsConnected(true);
      setIsConnecting(false);

      toast({
        title: "Phoenix Connected",
        description: "Voice connection established. Start speaking!",
      });

    } catch (error: any) {
      console.error('[PHOENIX-REALTIME] Connection error:', error);
      setIsConnecting(false);
      onError?.(error.message);
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to connect to Phoenix',
        variant: 'destructive',
      });
    }
  }, [isConnected, isConnecting, onError, toast]);

  const handleRealtimeEvent = useCallback((event: any) => {
    console.log('[PHOENIX-REALTIME] Event:', event.type, event);

    switch (event.type) {
      case 'response.audio.delta':
        // AI is speaking
        if (!isSpeaking) {
          setIsSpeaking(true);
          onSpeakingChange?.(true);
        }
        break;

      case 'response.audio.done':
        // AI finished speaking
        setIsSpeaking(false);
        onSpeakingChange?.(false);
        break;

      case 'response.audio_transcript.done':
        // AI transcript complete
        if (event.transcript) {
          onTranscript?.(event.transcript, 'assistant');
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User transcript
        if (event.transcript) {
          onTranscript?.(event.transcript, 'user');
        }
        break;

      case 'response.function_call_arguments.done':
        // AI wants to use a whiteboard tool
        handleFunctionCall(event);
        break;

      case 'error':
        console.error('[PHOENIX-REALTIME] API Error:', event.error);
        onError?.(event.error?.message || 'Unknown error');
        break;
    }
  }, [isSpeaking, onSpeakingChange, onTranscript, onError]);

  const handleFunctionCall = useCallback((event: any) => {
    const { name, call_id } = event;
    let args = {};
    
    try {
      args = JSON.parse(event.arguments || '{}');
    } catch (e) {
      console.error('[PHOENIX-REALTIME] Failed to parse function args:', e);
    }

    console.log('[PHOENIX-REALTIME] Function call:', name, args);

    // Execute whiteboard action
    const action: WhiteboardAction = {
      type: name as WhiteboardAction['type'],
      params: args
    };
    
    onWhiteboardAction?.(action);

    // Send function result back to AI
    if (dcRef.current?.readyState === 'open') {
      // For capture_screenshot, we'll need to handle this specially
      if (name === 'capture_screenshot') {
        // The Phoenix component will handle sending the screenshot
        return;
      }

      // Acknowledge the function call
      const resultEvent = {
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id,
          output: JSON.stringify({ success: true, action: name })
        }
      };
      
      dcRef.current.send(JSON.stringify(resultEvent));
      dcRef.current.send(JSON.stringify({ type: 'response.create' }));
    }
  }, [onWhiteboardAction]);

  const sendTextMessage = useCallback((text: string) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') {
      console.error('[PHOENIX-REALTIME] Data channel not ready');
      return;
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    dcRef.current.send(JSON.stringify(event));
    dcRef.current.send(JSON.stringify({ type: 'response.create' }));
    
    onTranscript?.(text, 'user');
  }, [onTranscript]);

  const sendScreenshot = useCallback((imageBase64: string, context: string) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') {
      console.error('[PHOENIX-REALTIME] Data channel not ready');
      return;
    }

    console.log('[PHOENIX-REALTIME] Sending screenshot to AI');

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `[Whiteboard screenshot captured: ${context}]`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${imageBase64}`
            }
          }
        ]
      }
    };

    dcRef.current.send(JSON.stringify(event));
    dcRef.current.send(JSON.stringify({ type: 'response.create' }));
  }, []);

  const disconnect = useCallback(() => {
    console.log('[PHOENIX-REALTIME] Disconnecting...');
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    connect,
    disconnect,
    sendTextMessage,
    sendScreenshot
  };
};
