-- Create Phoenix AI teaching sessions table
CREATE TABLE IF NOT EXISTS public.phoenix_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Session',
  whiteboard_state JSONB DEFAULT '{}'::jsonb,
  session_transcript JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phoenix_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for phoenix_sessions
CREATE POLICY "Users can view their own phoenix sessions"
  ON public.phoenix_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own phoenix sessions"
  ON public.phoenix_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phoenix sessions"
  ON public.phoenix_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own phoenix sessions"
  ON public.phoenix_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_phoenix_sessions_user_id ON public.phoenix_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_phoenix_sessions_updated_at ON public.phoenix_sessions(updated_at DESC);

-- Enable realtime for phoenix sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.phoenix_sessions;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_phoenix_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_phoenix_sessions_updated_at
  BEFORE UPDATE ON public.phoenix_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_phoenix_session_timestamp();