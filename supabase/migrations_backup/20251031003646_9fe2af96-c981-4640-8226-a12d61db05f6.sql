-- Create meetings table for Google Meet links
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  meeting_link TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Policies for meetings
CREATE POLICY "Pod members can view meetings"
ON public.meetings FOR SELECT
USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Pod members can create meetings"
ON public.meetings FOR INSERT
WITH CHECK (has_pod_access(auth.uid(), pod_id) AND auth.uid() = created_by);

CREATE POLICY "Creators can delete their meetings"
ON public.meetings FOR DELETE
USING (auth.uid() = created_by);

CREATE POLICY "Pod members can update meetings"
ON public.meetings FOR UPDATE
USING (has_pod_access(auth.uid(), pod_id));

-- Create quizzes table
CREATE TABLE public.pod_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  curriculum TEXT,
  year_level TEXT,
  subject TEXT,
  topic TEXT,
  subtopic TEXT,
  quiz_type TEXT NOT NULL CHECK (quiz_type IN ('mcq', 'essay')),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pod_quizzes ENABLE ROW LEVEL SECURITY;

-- Policies for quizzes
CREATE POLICY "Pod members can view quizzes"
ON public.pod_quizzes FOR SELECT
USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Teachers can create quizzes"
ON public.pod_quizzes FOR INSERT
WITH CHECK (is_pod_teacher(auth.uid(), pod_id) AND auth.uid() = created_by);

CREATE POLICY "Teachers can update their quizzes"
ON public.pod_quizzes FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Teachers can delete their quizzes"
ON public.pod_quizzes FOR DELETE
USING (auth.uid() = created_by);

-- Create quiz responses table
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.pod_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, user_id)
);

-- Enable RLS
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Policies for quiz responses
CREATE POLICY "Users can view their own responses"
ON public.quiz_responses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all responses in their pods"
ON public.quiz_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pod_quizzes pq
    JOIN public.pods p ON pq.pod_id = p.id
    WHERE pq.id = quiz_responses.quiz_id AND p.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can create responses"
ON public.quiz_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
ON public.quiz_responses FOR UPDATE
USING (auth.uid() = user_id);

-- Function to check quiz creation limit for free tier
CREATE OR REPLACE FUNCTION check_quiz_limit(teacher_id UUID, pod_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_tier TEXT;
  quiz_count INTEGER;
BEGIN
  -- Get user's subscription tier
  SELECT COALESCE(tier, 'free') INTO user_tier
  FROM subscriptions
  WHERE user_id = teacher_id AND status = 'active'
  LIMIT 1;
  
  -- If premium, no limit
  IF user_tier = 'premium' THEN
    RETURN true;
  END IF;
  
  -- Count existing quizzes for this teacher
  SELECT COUNT(*) INTO quiz_count
  FROM pod_quizzes
  WHERE created_by = teacher_id;
  
  -- Free tier: max 2 quizzes
  RETURN quiz_count < 2;
END;
$$;