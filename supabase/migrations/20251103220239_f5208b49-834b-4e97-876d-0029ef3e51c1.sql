-- Create interview_sessions table
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_role_link TEXT,
  job_description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  num_questions INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed'))
);

-- Create interview_recordings table
CREATE TABLE IF NOT EXISTS public.interview_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  time_limit_seconds INTEGER NOT NULL,
  video_url TEXT NOT NULL,
  duration_seconds INTEGER,
  attempt_number INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number IN (1, 2)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interview_sessions
CREATE POLICY "Users can view their own interview sessions"
  ON public.interview_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interview sessions"
  ON public.interview_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview sessions"
  ON public.interview_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview sessions"
  ON public.interview_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for interview_recordings
CREATE POLICY "Users can view their own interview recordings"
  ON public.interview_recordings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = interview_recordings.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own interview recordings"
  ON public.interview_recordings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = interview_recordings.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own interview recordings"
  ON public.interview_recordings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = interview_recordings.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own interview recordings"
  ON public.interview_recordings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = interview_recordings.session_id
      AND user_id = auth.uid()
    )
  );

-- Create storage bucket for interview recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('interview-recordings', 'interview-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for interview recordings
CREATE POLICY "Users can upload their own interview recordings"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'interview-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own interview recordings"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'interview-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own interview recordings"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'interview-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own interview recordings"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'interview-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at ON public.interview_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_recordings_session_id ON public.interview_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_recordings_created_at ON public.interview_recordings(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();