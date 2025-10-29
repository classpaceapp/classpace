-- Create teacher_profiles table for public teaching profiles
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  years_experience INTEGER NOT NULL DEFAULT 0,
  teaching_experience TEXT,
  qualifications JSONB DEFAULT '[]'::jsonb,
  subjects_expertise TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Teachers can insert their own profile
CREATE POLICY "Teachers can insert own profile"
ON public.teacher_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  )
);

-- Teachers can update their own profile
CREATE POLICY "Teachers can update own profile"
ON public.teacher_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Everyone can view public teacher profiles
CREATE POLICY "Anyone can view public profiles"
ON public.teacher_profiles
FOR SELECT
TO authenticated
USING (is_public = true);

-- Teachers can view their own profile even if private
CREATE POLICY "Teachers can view own profile"
ON public.teacher_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_teacher_profiles_updated_at
BEFORE UPDATE ON public.teacher_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();