-- Create personal_flashcards table (outside of pods)
CREATE TABLE IF NOT EXISTS public.personal_flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  curriculum TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  card_count INTEGER NOT NULL DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create personal_flashcard_cards table
CREATE TABLE IF NOT EXISTS public.personal_flashcard_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flashcard_set_id UUID NOT NULL REFERENCES public.personal_flashcards(id) ON DELETE CASCADE,
  hint TEXT NOT NULL,
  content TEXT NOT NULL,
  card_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create personal_quizzes table (outside of pods)
CREATE TABLE IF NOT EXISTS public.personal_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  curriculum TEXT,
  year_level TEXT,
  subject TEXT,
  topic TEXT,
  subtopic TEXT,
  quiz_type TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_flashcard_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_quizzes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personal_flashcards
CREATE POLICY "Users can view their own flashcards"
  ON public.personal_flashcards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flashcards"
  ON public.personal_flashcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards"
  ON public.personal_flashcards FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for personal_flashcard_cards
CREATE POLICY "Users can view their own flashcard cards"
  ON public.personal_flashcard_cards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.personal_flashcards pf
    WHERE pf.id = flashcard_set_id AND pf.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own flashcard cards"
  ON public.personal_flashcard_cards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.personal_flashcards pf
    WHERE pf.id = flashcard_set_id AND pf.user_id = auth.uid()
  ));

-- RLS Policies for personal_quizzes
CREATE POLICY "Users can view their own quizzes"
  ON public.personal_quizzes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quizzes"
  ON public.personal_quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes"
  ON public.personal_quizzes FOR UPDATE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_personal_flashcards_user_id ON public.personal_flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_flashcards_archived ON public.personal_flashcards(archived);
CREATE INDEX IF NOT EXISTS idx_personal_quizzes_user_id ON public.personal_quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_quizzes_archived ON public.personal_quizzes(archived);