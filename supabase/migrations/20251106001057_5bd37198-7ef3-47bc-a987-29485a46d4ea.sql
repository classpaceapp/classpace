-- Create global teaching resources table
CREATE TABLE IF NOT EXISTS public.teaching_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'link', 'pdf', 'doc', 'ppt', 'other'
  file_url TEXT,
  external_link TEXT,
  file_name TEXT,
  file_size BIGINT,
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.teaching_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can view
CREATE POLICY "Anyone can view teaching resources"
ON public.teaching_resources
FOR SELECT
USING (true);

-- Teachers can create resources
CREATE POLICY "Teachers can create teaching resources"
ON public.teaching_resources
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
  )
);

-- Creators can update their own resources
CREATE POLICY "Creators can update their own teaching resources"
ON public.teaching_resources
FOR UPDATE
USING (auth.uid() = uploaded_by);

-- Creators can delete their own resources
CREATE POLICY "Creators can delete their own teaching resources"
ON public.teaching_resources
FOR DELETE
USING (auth.uid() = uploaded_by);

-- Create index for faster searching
CREATE INDEX IF NOT EXISTS idx_teaching_resources_category ON public.teaching_resources(category);
CREATE INDEX IF NOT EXISTS idx_teaching_resources_type ON public.teaching_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_teaching_resources_tags ON public.teaching_resources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_teaching_resources_uploaded_by ON public.teaching_resources(uploaded_by);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_teaching_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teaching_resources_timestamp
BEFORE UPDATE ON public.teaching_resources
FOR EACH ROW
EXECUTE FUNCTION update_teaching_resources_updated_at();