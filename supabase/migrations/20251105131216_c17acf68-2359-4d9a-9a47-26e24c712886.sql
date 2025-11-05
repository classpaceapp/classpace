-- Create saved_curriculums table
CREATE TABLE public.saved_curriculums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  duration TEXT NOT NULL,
  learning_goals TEXT,
  curriculum_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_curriculums ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Teachers can create their own curriculums"
ON public.saved_curriculums
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can view their own curriculums"
ON public.saved_curriculums
FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own curriculums"
ON public.saved_curriculums
FOR DELETE
USING (auth.uid() = teacher_id);

-- Create saved_lessons table
CREATE TABLE public.saved_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  subject TEXT NOT NULL,
  curriculum TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  duration TEXT NOT NULL,
  topic TEXT,
  lesson_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_lessons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Teachers can create their own lessons"
ON public.saved_lessons
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can view their own lessons"
ON public.saved_lessons
FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own lessons"
ON public.saved_lessons
FOR DELETE
USING (auth.uid() = teacher_id);