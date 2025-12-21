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
  const [isListening, setIsListening] = useState(false);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const sessionReadyRef = useRef<boolean>(false);
  
  // Track pending function calls for real-time whiteboard
  const pendingFunctionArgsRef = useRef<Map<string, string>>(new Map());
  
  // Track if we should ignore incoming events (after stop)
  const ignoreEventsRef = useRef<boolean>(false);

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
    sessionReadyRef.current = false;
    ignoreEventsRef.current = false;
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
        console.log('[PHOENIX-REALTIME] Received remote track:', e.track.kind);
        if (audioElRef.current) {
          audioElRef.current.srcObject = e.streams[0];
        }
      };

      // Add local audio track
      stream.getTracks().forEach(track => {
        console.log('[PHOENIX-REALTIME] Adding local track:', track.kind);
        pc.addTrack(track, stream);
      });

      // Set up data channel for events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.addEventListener('open', () => {
        console.log('[PHOENIX-REALTIME] Data channel opened - waiting for session.created');
      });

      dc.addEventListener('message', (e) => {
        handleRealtimeEvent(JSON.parse(e.data));
      });

      dc.addEventListener('error', (e) => {
        console.error('[PHOENIX-REALTIME] Data channel error:', e);
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
        const errorText = await sdpResponse.text();
        console.error('[PHOENIX-REALTIME] SDP error:', errorText);
        throw new Error(`WebRTC connection failed: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await pc.setRemoteDescription(answer);
      console.log('[PHOENIX-REALTIME] WebRTC connection established, waiting for session...');

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
    // If we're ignoring events (after stop), skip processing
    if (ignoreEventsRef.current && 
        !['session.created', 'session.updated', 'error'].includes(event.type)) {
      console.log('[PHOENIX-REALTIME] Ignoring event (stopped):', event.type);
      return;
    }
    
    console.log('[PHOENIX-REALTIME] Event:', event.type);

    switch (event.type) {
      case 'session.created':
        console.log('[PHOENIX-REALTIME] Session created!', event.session);
        sessionReadyRef.current = true;
        ignoreEventsRef.current = false;
        setIsConnected(true);
        setIsConnecting(false);
        setIsListening(true);
        
        toast({
          title: "Phoenix Connected",
          description: "Start speaking - Phoenix is listening!",
        });
        break;

      case 'session.updated':
        console.log('[PHOENIX-REALTIME] Session updated:', event.session);
        break;

      case 'input_audio_buffer.speech_started':
        console.log('[PHOENIX-REALTIME] Speech detected - user is talking');
        setIsListening(false);
        
        // INTERRUPT: ALWAYS stop Phoenix when user starts talking (unconditional)
        // We don't check isSpeaking because it can be unreliable
        console.log('[PHOENIX-REALTIME] User started speaking - interrupting any ongoing response');
        
        // Mute audio immediately
        if (audioElRef.current) {
          audioElRef.current.pause();
          audioElRef.current.srcObject = null;
          const newAudioEl = document.createElement('audio');
          newAudioEl.autoplay = true;
          audioElRef.current = newAudioEl;
        }
        
        // Send cancel
        if (dcRef.current?.readyState === 'open') {
          try {
            dcRef.current.send(JSON.stringify({ type: 'response.cancel' }));
            console.log('[PHOENIX-REALTIME] Sent speech-interrupt cancel');
          } catch (e) {
            console.error('[PHOENIX-REALTIME] Failed to send speech interrupt cancel:', e);
          }
        }
        
        setIsSpeaking(false);
        onSpeakingChange?.(false);
        
        // Reconnect audio after short delay
        setTimeout(() => {
          if (pcRef.current && audioElRef.current) {
            const receivers = pcRef.current.getReceivers();
            const audioReceiver = receivers.find(r => r.track?.kind === 'audio');
            if (audioReceiver?.track) {
              const stream = new MediaStream([audioReceiver.track]);
              audioElRef.current.srcObject = stream;
            }
          }
        }, 200);
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('[PHOENIX-REALTIME] Speech stopped - processing...');
        break;

      case 'input_audio_buffer.committed':
        console.log('[PHOENIX-REALTIME] Audio buffer committed');
        break;

      case 'conversation.item.created':
        console.log('[PHOENIX-REALTIME] Conversation item created:', event.item?.type);
        break;

      case 'response.created':
        console.log('[PHOENIX-REALTIME] Response started');
        break;

      case 'response.output_item.added':
        console.log('[PHOENIX-REALTIME] Output item added:', event.item?.type);
        break;

      case 'response.audio.delta':
        // AI is speaking
        if (!isSpeaking) {
          setIsSpeaking(true);
          setIsListening(false);
          onSpeakingChange?.(true);
        }
        break;

      case 'response.audio.done':
        // AI finished this audio chunk
        console.log('[PHOENIX-REALTIME] Audio chunk done');
        break;

      case 'response.audio_transcript.delta':
        // Incremental transcript - could be used for real-time display
        break;

      case 'response.audio_transcript.done':
        // AI transcript complete
        if (event.transcript) {
          console.log('[PHOENIX-REALTIME] AI said:', event.transcript.substring(0, 100) + '...');
          onTranscript?.(event.transcript, 'assistant');
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User transcript
        if (event.transcript) {
          console.log('[PHOENIX-REALTIME] User said:', event.transcript);
          onTranscript?.(event.transcript, 'user');
        }
        break;

      case 'response.function_call_arguments.delta':
        // Incremental function call arguments - for real-time whiteboard
        const { call_id, delta } = event;
        if (call_id && delta) {
          const existing = pendingFunctionArgsRef.current.get(call_id) || '';
          pendingFunctionArgsRef.current.set(call_id, existing + delta);
        }
        break;

      case 'response.function_call_arguments.done':
        // AI wants to use a whiteboard tool
        handleFunctionCall(event);
        break;

      case 'response.done':
        // Full response complete
        console.log('[PHOENIX-REALTIME] Response complete');
        setIsSpeaking(false);
        setIsListening(true);
        onSpeakingChange?.(false);
        break;

      case 'error':
        console.error('[PHOENIX-REALTIME] API Error:', event.error);
        onError?.(event.error?.message || 'Unknown error');
        toast({
          title: 'Phoenix Error',
          description: event.error?.message || 'Something went wrong',
          variant: 'destructive',
        });
        break;

      default:
        // Log other events for debugging
        if (event.type && !event.type.startsWith('rate_limits')) {
          console.log('[PHOENIX-REALTIME] Unhandled event:', event.type);
        }
    }
  }, [isSpeaking, onSpeakingChange, onTranscript, onError, toast]);

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

    // Clear pending args
    if (call_id) {
      pendingFunctionArgsRef.current.delete(call_id);
    }

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

  // Interrupt any ongoing response - stop audio and cancel response
  // IMPORTANT: This is now UNCONDITIONAL - we always attempt to stop audio
  // because isSpeaking state can be unreliable (response.audio.delta events may not fire)
  const interruptResponse = useCallback(() => {
    console.log('[PHOENIX-REALTIME] Interrupting any ongoing response (unconditional)...');
    
    // Set flag to ignore incoming events temporarily
    ignoreEventsRef.current = true;
    
    // Mute audio immediately - don't check isSpeaking, just do it
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.srcObject = null;
      const newAudioEl = document.createElement('audio');
      newAudioEl.autoplay = true;
      audioElRef.current = newAudioEl;
    }
    
    // Send cancel event - always attempt this
    if (dcRef.current?.readyState === 'open') {
      try {
        dcRef.current.send(JSON.stringify({ type: 'response.cancel' }));
        console.log('[PHOENIX-REALTIME] Sent interrupt cancel');
      } catch (e) {
        console.error('[PHOENIX-REALTIME] Failed to send interrupt cancel:', e);
      }
    }
    
    // Clear pending function calls
    pendingFunctionArgsRef.current.clear();
    
    // Reset states
    setIsSpeaking(false);
    onSpeakingChange?.(false);
    
    // Re-enable events after short delay
    setTimeout(() => {
      ignoreEventsRef.current = false;
      if (pcRef.current && audioElRef.current) {
        const receivers = pcRef.current.getReceivers();
        const audioReceiver = receivers.find(r => r.track?.kind === 'audio');
        if (audioReceiver?.track) {
          const stream = new MediaStream([audioReceiver.track]);
          audioElRef.current.srcObject = stream;
        }
      }
    }, 200);
  }, [onSpeakingChange]);

  const sendTextMessage = useCallback((text: string) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') {
      console.error('[PHOENIX-REALTIME] Data channel not ready');
      return;
    }

    if (!sessionReadyRef.current) {
      console.error('[PHOENIX-REALTIME] Session not ready yet');
      return;
    }

    // INTERRUPT: Stop any ongoing response before sending new message
    interruptResponse();

    console.log('[PHOENIX-REALTIME] Sending text message:', text);

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
  }, [onTranscript, interruptResponse]);

  // Send whiteboard context as text (since realtime model doesn't support images)
  // triggerResponse: if false, injects context silently without prompting AI to respond
  const sendWhiteboardContext = useCallback((context: string, triggerResponse: boolean = true) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') {
      console.error('[PHOENIX-REALTIME] Data channel not ready');
      return;
    }

    console.log('[PHOENIX-REALTIME] Sending whiteboard context as text, triggerResponse:', triggerResponse);

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: context
          }
        ]
      }
    };

    dcRef.current.send(JSON.stringify(event));
    
    // Only trigger a response if explicitly requested
    // For context injection during mode switches, we don't want to trigger a response
    if (triggerResponse) {
      dcRef.current.send(JSON.stringify({ type: 'response.create' }));
    }
  }, []);

  // NOTE: The gpt-4o-realtime-preview model does NOT support image inputs.
  // Instead of sending screenshots, we send a text description of the whiteboard.
  const sendScreenshot = useCallback((imageBase64: string, context: string) => {
    console.warn('[PHOENIX-REALTIME] Image input not supported by realtime model. Sending text context instead.');
    
    // Instead of sending the image, send a text message explaining we captured the whiteboard
    // This DOES trigger a response since the user explicitly asked for screenshot analysis
    sendWhiteboardContext(`[I captured a screenshot of the whiteboard. Context: ${context}. Please describe what you'd like me to analyze or help with based on our conversation.]`, true);
  }, [sendWhiteboardContext]);

  // Stop Phoenix mid-response (cancel current response and mute audio)
  const stop = useCallback(() => {
    console.log('[PHOENIX-REALTIME] Stopping Phoenix...');
    
    // Set flag to ignore incoming events
    ignoreEventsRef.current = true;
    
    // Mute audio immediately to stop playback
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.srcObject = null;
      // Recreate audio element for next response
      const newAudioEl = document.createElement('audio');
      newAudioEl.autoplay = true;
      audioElRef.current = newAudioEl;
    }
    
    // Send cancel event to OpenAI
    if (dcRef.current?.readyState === 'open') {
      try {
        dcRef.current.send(JSON.stringify({ type: 'response.cancel' }));
        console.log('[PHOENIX-REALTIME] Sent response.cancel');
      } catch (e) {
        console.error('[PHOENIX-REALTIME] Failed to send cancel:', e);
      }
    }
    
    // Clear pending function calls
    pendingFunctionArgsRef.current.clear();
    
    // Reset states
    setIsSpeaking(false);
    setIsListening(true);
    onSpeakingChange?.(false);
    
    // Re-enable events after a short delay (for next response)
    setTimeout(() => {
      ignoreEventsRef.current = false;
      // Reconnect audio if still connected
      if (pcRef.current && audioElRef.current) {
        const receivers = pcRef.current.getReceivers();
        const audioReceiver = receivers.find(r => r.track?.kind === 'audio');
        if (audioReceiver?.track) {
          const stream = new MediaStream([audioReceiver.track]);
          audioElRef.current.srcObject = stream;
        }
      }
    }, 500);
    
    toast({
      title: "Phoenix stopped",
      description: "Ready for your next question",
    });
  }, [onSpeakingChange, toast]);

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
    
    sessionReadyRef.current = false;
    ignoreEventsRef.current = false;
    pendingFunctionArgsRef.current.clear();
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setIsListening(false);
  }, []);

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    isListening,
    connect,
    disconnect,
    stop,
    sendTextMessage,
    sendScreenshot,
    sendWhiteboardContext
  };
};