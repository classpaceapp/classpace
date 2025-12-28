-- Create nexus_assessments table for storing teacher-created assessments
CREATE TABLE public.nexus_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assessment_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  num_questions INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  curriculum TEXT NOT NULL,
  year_level TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  public_link_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 12)
);

-- Create assessment_responses table for storing student responses
CREATE TABLE public.assessment_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.nexus_assessments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nexus_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nexus_assessments
CREATE POLICY "Teachers can create their own assessments"
  ON public.nexus_assessments
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can view their own assessments"
  ON public.nexus_assessments
  FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own assessments"
  ON public.nexus_assessments
  FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own assessments"
  ON public.nexus_assessments
  FOR DELETE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Anyone can view assessments by public link"
  ON public.nexus_assessments
  FOR SELECT
  USING (true);

-- RLS Policies for assessment_responses
CREATE POLICY "Anyone can submit responses"
  ON public.assessment_responses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teachers can view responses for their assessments"
  ON public.assessment_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.nexus_assessments
      WHERE nexus_assessments.id = assessment_responses.assessment_id
      AND nexus_assessments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own responses"
  ON public.assessment_responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for faster public link lookups
CREATE INDEX idx_nexus_assessments_public_link ON public.nexus_assessments(public_link_code);

-- Create index for faster teacher lookups
CREATE INDEX idx_nexus_assessments_teacher ON public.nexus_assessments(teacher_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nexus_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nexus_assessments_timestamp
  BEFORE UPDATE ON public.nexus_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_nexus_assessments_updated_at();