import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Calendar, Clock, Video, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Session {
  id: string;
  created_at: string;
  job_role_link: string | null;
  job_description: string | null;
  num_questions: number;
  status: string;
}

interface Recording {
  id: string;
  question_index: number;
  question_text: string;
  video_url: string;
  created_at: string;
  attempt_number: number;
  duration_seconds: number | null;
}

const InterviewRecordingsList = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [recordings, setRecordings] = useState<Record<string, Recording[]>>({});
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      setSessions(sessionsData || []);

      // Load recordings for each session
      if (sessionsData && sessionsData.length > 0) {
        const sessionIds = sessionsData.map(s => s.id);
        const { data: recordingsData, error: recordingsError } = await supabase
          .from('interview_recordings')
          .select('*')
          .in('session_id', sessionIds)
          .order('question_index', { ascending: true });

        if (recordingsError) throw recordingsError;

        // Group recordings by session
        const grouped = (recordingsData || []).reduce((acc, rec) => {
          if (!acc[rec.session_id]) {
            acc[rec.session_id] = [];
          }
          acc[rec.session_id].push(rec);
          return acc;
        }, {} as Record<string, Recording[]>);

        setRecordings(grouped);
      }
    } catch (err: any) {
      console.error('Error loading sessions:', err);
      toast({
        title: 'Error',
        description: 'Failed to load interview recordings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const playRecording = async (videoUrl: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('interview-recordings')
        .createSignedUrl(videoUrl, 3600); // 1 hour

      if (error) throw error;

      setPlayingVideo(data.signedUrl);
    } catch (err: any) {
      console.error('Error loading video:', err);
      toast({
        title: 'Error',
        description: 'Failed to load video',
        variant: 'destructive',
      });
    }
  };

  const deleteSession = async (sessionId: string) => {
    setDeletingSession(sessionId);
    try {
      // Get all recordings for this session
      const sessionRecordings = recordings[sessionId] || [];
      
      // Delete video files from storage
      for (const recording of sessionRecordings) {
        const { error: storageError } = await supabase.storage
          .from('interview-recordings')
          .remove([recording.video_url]);
        
        if (storageError) {
          console.error('Error deleting video file:', storageError);
        }
      }

      // Delete recording records from database
      const { error: recordingsError } = await supabase
        .from('interview_recordings')
        .delete()
        .eq('session_id', sessionId);

      if (recordingsError) throw recordingsError;

      // Delete session
      const { error: sessionError } = await supabase
        .from('interview_sessions')
        .delete()
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Update UI
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setRecordings(prev => {
        const updated = { ...prev };
        delete updated[sessionId];
        return updated;
      });

      toast({
        title: 'Deleted',
        description: 'Interview practice session deleted successfully',
      });
    } catch (err: any) {
      console.error('Error deleting session:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete interview session',
        variant: 'destructive',
      });
    } finally {
      setDeletingSession(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading your practice interviews...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground text-lg">No practice interviews yet</p>
        <p className="text-muted-foreground text-sm mt-2">
          Start your first practice interview to see your recordings here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Your Practice Interviews
      </h3>

      {sessions.map((session) => {
        const sessionRecordings = recordings[session.id] || [];
        
        return (
          <Card
            key={session.id}
            className="border-2 border-blue-400/30 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 shadow-xl"
          >
            <CardHeader className="bg-gradient-to-r from-blue-100/50 via-indigo-100/50 to-purple-100/50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-b">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                    <Video className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {session.job_role_link ? 'Role-Specific Interview' : 'General Interview'}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {session.num_questions} questions
                      </span>
                    </div>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                      disabled={deletingSession === session.id}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Interview Practice?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this interview practice session and all its recordings. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteSession(session.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {session.job_role_link && (
                <div className="mb-4 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Job Role:</p>
                  <a
                    href={session.job_role_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline font-medium text-sm break-all"
                  >
                    {session.job_role_link}
                  </a>
                </div>
              )}

              <div className="space-y-3">
                {sessionRecordings.map((recording, idx) => (
                  <div
                    key={recording.id}
                    className="p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                            Q{recording.question_index + 1} - Attempt {recording.attempt_number}
                          </span>
                          {recording.duration_seconds && (
                            <span className="text-xs text-muted-foreground">
                              {Math.floor(recording.duration_seconds / 60)}:{(recording.duration_seconds % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {recording.question_text}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => playRecording(recording.video_url)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Video Player Modal */}
      {playingVideo && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
          onClick={() => setPlayingVideo(null)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <video
              src={playingVideo}
              controls
              autoPlay
              className="w-full rounded-xl shadow-2xl"
            />
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setPlayingVideo(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRecordingsList;