import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePhoenixVoice = () => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('[PHOENIX-VOICE] Recording started');
    } catch (error) {
      console.error('[PHOENIX-VOICE] Error starting recording:', error);
      toast({
        title: 'Microphone Error',
        description: 'Failed to access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('[PHOENIX-VOICE] Audio blob created, size:', audioBlob.size);

          // Convert to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];

            // Send to STT edge function
            console.log('[PHOENIX-VOICE] Sending to STT...');
            const { data, error } = await supabase.functions.invoke('phoenix-voice-stt', {
              body: { audio: base64Audio }
            });

            if (error) {
              console.error('[PHOENIX-VOICE] STT error:', error);
              toast({
                title: 'Transcription Error',
                description: 'Failed to transcribe audio',
                variant: 'destructive',
              });
              resolve(null);
            } else {
              console.log('[PHOENIX-VOICE] Transcription:', data.text);
              resolve(data.text);
            }

            setIsProcessing(false);
          };
        } catch (error) {
          console.error('[PHOENIX-VOICE] Error processing audio:', error);
          toast({
            title: 'Processing Error',
            description: 'Failed to process audio',
            variant: 'destructive',
          });
          setIsProcessing(false);
          resolve(null);
        }
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    });
  }, [toast]);

  const speakText = useCallback(async (text: string): Promise<void> => {
    try {
      console.log('[PHOENIX-VOICE] Generating speech for:', text.substring(0, 50));

      // Call TTS edge function
      const { data, error } = await supabase.functions.invoke('phoenix-voice-tts', {
        body: { text, voice: 'nova' }
      });

      if (error) {
        console.error('[PHOENIX-VOICE] TTS error:', error);
        throw error;
      }

      // Play audio
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioData = atob(data.audioContent);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);

      console.log('[PHOENIX-VOICE] Playing audio');
    } catch (error) {
      console.error('[PHOENIX-VOICE] Error in TTS:', error);
      toast({
        title: 'Speech Error',
        description: 'Failed to generate speech',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    speakText,
  };
};
