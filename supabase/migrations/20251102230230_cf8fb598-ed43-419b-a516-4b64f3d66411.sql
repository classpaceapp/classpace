-- Create personal_notes table
CREATE TABLE IF NOT EXISTS public.personal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  curriculum TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  additional_details TEXT,
  content TEXT NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own notes"
  ON public.personal_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notes"
  ON public.personal_notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.personal_notes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_personal_notes_user_id ON public.personal_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_notes_archived ON public.personal_notes(user_id, archived);