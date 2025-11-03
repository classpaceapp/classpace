import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Video, VideoOff, Mic, MicOff, StopCircle, Circle, ArrowRight, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  text: string;
  timeLimit: number;
  category: string;
}

interface InterviewRoomProps {
  sessionId: string;
  questions: Question[];
  onComplete: () => void;
  onExit: () => void;
}

const InterviewRoom = ({ sessionId, questions, onComplete, onExit }: InterviewRoomProps) => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [attempt, setAttempt] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(questions[0]?.timeLimit || 0);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    setTimeRemaining(questions[currentQuestionIndex]?.timeLimit || 0);
  }, [currentQuestionIndex, questions]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera and microphone access',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const startRecording = () => {
    if (!streamRef.current) {
      toast({
        title: 'Camera not ready',
        description: 'Please wait for camera to initialize',
        variant: 'destructive',
      });
      return;
    }

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp8,opus',
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      await uploadRecording();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const uploadRecording = async () => {
    setUploading(true);
    try {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}/${sessionId}_q${currentQuestionIndex}_a${attempt}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('interview-recordings')
        .upload(fileName, blob, {
          contentType: 'video/webm',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Save recording metadata
      const { error: dbError } = await supabase
        .from('interview_recordings')
        .insert({
          session_id: sessionId,
          question_index: currentQuestionIndex,
          question_text: questions[currentQuestionIndex].text,
          time_limit_seconds: questions[currentQuestionIndex].timeLimit,
          video_url: fileName,
          duration_seconds: questions[currentQuestionIndex].timeLimit - timeRemaining,
          attempt_number: attempt,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Recording saved',
        description: `Answer ${attempt} saved successfully`,
      });

    } catch (err: any) {
      console.error('Upload error:', err);
      toast({
        title: 'Upload failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setAttempt(1);
      setTimeRemaining(questions[currentQuestionIndex + 1].timeLimit);
    } else {
      handleEndInterview();
    }
  };

  const handleRetry = () => {
    if (attempt < 2) {
      setAttempt(2);
      setTimeRemaining(questions[currentQuestionIndex].timeLimit);
    }
  };

  const handleEndInterview = async () => {
    try {
      const { error } = await supabase
        .from('interview_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);

      if (error) throw error;

      stopCamera();
      onComplete();
    } catch (err: any) {
      console.error('Error ending interview:', err);
      toast({
        title: 'Error',
        description: 'Failed to end interview',
        variant: 'destructive',
      });
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 z-50 overflow-auto">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white font-semibold">Interview in Progress</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-white text-sm">
              Attempt {attempt} of 2
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Video Feed */}
          <Card className="bg-black/40 border-2 border-white/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Your Video</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleVideo}
                    className={videoEnabled ? 'text-white' : 'text-red-500'}
                  >
                    {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleAudio}
                    className={audioEnabled ? 'text-white' : 'text-red-500'}
                  >
                    {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full aspect-video rounded-lg bg-black"
              />
            </CardContent>
          </Card>

          {/* Question & Controls */}
          <Card className="bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 border-2 border-white/30 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                    {currentQuestion.category}
                  </span>
                  <span className="text-2xl font-bold">
                    {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white/10 p-6 rounded-xl border border-white/20">
                <p className="text-white text-lg leading-relaxed">
                  {currentQuestion.text}
                </p>
              </div>

              {/* Recording Controls */}
              <div className="space-y-3">
                {!isRecording && !uploading && (
                  <Button
                    onClick={startRecording}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                  >
                    <Circle className="h-5 w-5 mr-2 fill-current" />
                    Start Recording
                  </Button>
                )}

                {isRecording && (
                  <Button
                    onClick={stopRecording}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                  >
                    <StopCircle className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
                )}

                {uploading && (
                  <Button disabled className="w-full h-14 text-lg font-bold">
                    Saving...
                  </Button>
                )}

                {!isRecording && !uploading && attempt < 2 && (
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="w-full border-2 border-white/30 text-white hover:bg-white/10"
                  >
                    Try Again (Attempt 2)
                  </Button>
                )}

                {!isRecording && !uploading && (
                  <Button
                    onClick={handleNext}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        Next Question
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    ) : (
                      'End Interview'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;