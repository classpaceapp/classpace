
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('teacher', 'learner');

-- Create profiles table to store additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name)
  VALUES (
    new.id,
    (new.raw_user_meta_data ->> 'role')::user_role,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get user role (useful for RLS policies later)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;
-- Create comprehensive schema for Classpace

-- Create custom types
-- Type user_role created in previous migration
CREATE TYPE pod_member_role AS ENUM ('teacher', 'student');
CREATE TYPE ai_activity_type AS ENUM ('summary', 'quiz', 'question', 'timeline', 'explanation');
CREATE TYPE file_type AS ENUM ('pdf', 'docx', 'png', 'jpg', 'jpeg', 'mp4', 'pptx', 'txt');

-- Create pods table
CREATE TABLE public.pods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    grade_level TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pod_members table
CREATE TABLE public.pod_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role pod_member_role NOT NULL DEFAULT 'student',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(pod_id, user_id)
);

-- Create pod_chats table
CREATE TABLE public.pod_chats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pod_notes table
CREATE TABLE public.pod_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pod_materials table
CREATE TABLE public.pod_materials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type file_type NOT NULL,
    file_size BIGINT,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pod_whiteboards table
CREATE TABLE public.pod_whiteboards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    whiteboard_data JSONB NOT NULL DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create ai_activity_logs table
CREATE TABLE public.ai_activity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type ai_activity_type NOT NULL,
    input_text TEXT NOT NULL,
    output_text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pods
CREATE POLICY "Users can view pods they are members of" ON public.pods
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pods.id
    )
);

CREATE POLICY "Teachers can create pods" ON public.pods
FOR INSERT WITH CHECK (
    auth.uid() = created_by AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);

CREATE POLICY "Pod creators can update their pods" ON public.pods
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Pod creators can delete their pods" ON public.pods
FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for pod_members
CREATE POLICY "Users can view pod members for pods they belong to" ON public.pod_members
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members pm WHERE pm.pod_id = pod_members.pod_id
    )
);

CREATE POLICY "Teachers can add members to their pods" ON public.pod_members
FOR INSERT WITH CHECK (
    auth.uid() IN (
        SELECT created_by FROM public.pods WHERE id = pod_id
    )
);

CREATE POLICY "Teachers can remove members from their pods" ON public.pod_members
FOR DELETE USING (
    auth.uid() IN (
        SELECT created_by FROM public.pods WHERE id = pod_id
    ) OR auth.uid() = user_id
);

-- Create RLS policies for pod_chats
CREATE POLICY "Pod members can view chat messages" ON public.pod_chats
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_chats.pod_id
    )
);

CREATE POLICY "Pod members can send chat messages" ON public.pod_chats
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_chats.pod_id
    )
);

-- Create RLS policies for pod_notes
CREATE POLICY "Pod members can view notes" ON public.pod_notes
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_notes.pod_id
    )
);

CREATE POLICY "Teachers can create notes" ON public.pod_notes
FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    auth.uid() IN (
        SELECT pm.user_id FROM public.pod_members pm 
        WHERE pm.pod_id = pod_notes.pod_id AND pm.role = 'teacher'
    )
);

CREATE POLICY "Note creators can update their notes" ON public.pod_notes
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Note creators can delete their notes" ON public.pod_notes
FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for pod_materials
CREATE POLICY "Pod members can view materials" ON public.pod_materials
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_materials.pod_id
    )
);

CREATE POLICY "Pod members can upload materials" ON public.pod_materials
FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_materials.pod_id
    )
);

CREATE POLICY "Uploaders can delete their materials" ON public.pod_materials
FOR DELETE USING (auth.uid() = uploaded_by);

-- Create RLS policies for pod_whiteboards
CREATE POLICY "Pod members can view whiteboards" ON public.pod_whiteboards
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_whiteboards.pod_id
    )
);

CREATE POLICY "Pod members can update whiteboards" ON public.pod_whiteboards
FOR INSERT WITH CHECK (
    auth.uid() = updated_by AND
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_whiteboards.pod_id
    )
);

CREATE POLICY "Pod members can modify whiteboards" ON public.pod_whiteboards
FOR UPDATE USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_whiteboards.pod_id
    )
);

-- Create RLS policies for ai_activity_logs
CREATE POLICY "Users can view their own AI activity" ON public.ai_activity_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI activity logs" ON public.ai_activity_logs
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = ai_activity_logs.pod_id
    )
);

-- Create storage bucket for pod materials
INSERT INTO storage.buckets (id, name, public) VALUES ('pod-materials', 'pod-materials', false);

-- Create storage policies
CREATE POLICY "Pod members can view files" ON storage.objects
FOR SELECT USING (
    bucket_id = 'pod-materials' AND
    auth.uid() IN (
        SELECT pm.user_id FROM public.pod_members pm
        JOIN public.pod_materials mat ON mat.pod_id = pm.pod_id
        WHERE mat.file_url = CONCAT('pod-materials/', storage.objects.name)
    )
);

CREATE POLICY "Pod members can upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'pod-materials');

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_pods_updated_at
    BEFORE UPDATE ON public.pods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pod_notes_updated_at
    BEFORE UPDATE ON public.pod_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);
-- Create comprehensive schema for Classpace (without existing user_role type)

-- Create custom types (skip user_role as it exists)
CREATE TYPE pod_member_role AS ENUM ('teacher', 'student');
CREATE TYPE ai_activity_type AS ENUM ('summary', 'quiz', 'question', 'timeline', 'explanation');
CREATE TYPE file_type AS ENUM ('pdf', 'docx', 'png', 'jpg', 'jpeg', 'mp4', 'pptx', 'txt');

-- Create pods table
CREATE TABLE public.pods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    grade_level TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pod_members table
CREATE TABLE public.pod_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role pod_member_role NOT NULL DEFAULT 'student',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(pod_id, user_id)
);

-- Create pod_chats table
CREATE TABLE public.pod_chats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pod_notes table
CREATE TABLE public.pod_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pod_materials table
CREATE TABLE public.pod_materials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type file_type NOT NULL,
    file_size BIGINT,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pod_whiteboards table
CREATE TABLE public.pod_whiteboards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    whiteboard_data JSONB NOT NULL DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create ai_activity_logs table
CREATE TABLE public.ai_activity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type ai_activity_type NOT NULL,
    input_text TEXT NOT NULL,
    output_text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pods
CREATE POLICY "Users can view pods they are members of" ON public.pods
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pods.id
    )
);

CREATE POLICY "Teachers can create pods" ON public.pods
FOR INSERT WITH CHECK (
    auth.uid() = created_by AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);

CREATE POLICY "Pod creators can update their pods" ON public.pods
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Pod creators can delete their pods" ON public.pods
FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for pod_members
CREATE POLICY "Users can view pod members for pods they belong to" ON public.pod_members
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members pm WHERE pm.pod_id = pod_members.pod_id
    )
);

CREATE POLICY "Teachers can add members to their pods" ON public.pod_members
FOR INSERT WITH CHECK (
    auth.uid() IN (
        SELECT created_by FROM public.pods WHERE id = pod_id
    )
);

CREATE POLICY "Teachers can remove members from their pods" ON public.pod_members
FOR DELETE USING (
    auth.uid() IN (
        SELECT created_by FROM public.pods WHERE id = pod_id
    ) OR auth.uid() = user_id
);

-- Create RLS policies for pod_chats
CREATE POLICY "Pod members can view chat messages" ON public.pod_chats
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_chats.pod_id
    )
);

CREATE POLICY "Pod members can send chat messages" ON public.pod_chats
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_chats.pod_id
    )
);

-- Create RLS policies for pod_notes
CREATE POLICY "Pod members can view notes" ON public.pod_notes
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_notes.pod_id
    )
);

CREATE POLICY "Teachers can create notes" ON public.pod_notes
FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    auth.uid() IN (
        SELECT pm.user_id FROM public.pod_members pm 
        WHERE pm.pod_id = pod_notes.pod_id AND pm.role = 'teacher'
    )
);

CREATE POLICY "Note creators can update their notes" ON public.pod_notes
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Note creators can delete their notes" ON public.pod_notes
FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for pod_materials
CREATE POLICY "Pod members can view materials" ON public.pod_materials
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_materials.pod_id
    )
);

CREATE POLICY "Pod members can upload materials" ON public.pod_materials
FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_materials.pod_id
    )
);

CREATE POLICY "Uploaders can delete their materials" ON public.pod_materials
FOR DELETE USING (auth.uid() = uploaded_by);

-- Create RLS policies for pod_whiteboards
CREATE POLICY "Pod members can view whiteboards" ON public.pod_whiteboards
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_whiteboards.pod_id
    )
);

CREATE POLICY "Pod members can update whiteboards" ON public.pod_whiteboards
FOR INSERT WITH CHECK (
    auth.uid() = updated_by AND
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_whiteboards.pod_id
    )
);

CREATE POLICY "Pod members can modify whiteboards" ON public.pod_whiteboards
FOR UPDATE USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_whiteboards.pod_id
    )
);

-- Create RLS policies for ai_activity_logs
CREATE POLICY "Users can view their own AI activity" ON public.ai_activity_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI activity logs" ON public.ai_activity_logs
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = ai_activity_logs.pod_id
    )
);

-- Create storage bucket for pod materials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pod-materials', 'pod-materials', false);

-- Create storage policies
CREATE POLICY "Pod members can view files" ON storage.objects
FOR SELECT USING (
    bucket_id = 'pod-materials' AND
    auth.uid() IN (
        SELECT pm.user_id FROM public.pod_members pm
        JOIN public.pod_materials mat ON mat.pod_id = pm.pod_id
        WHERE mat.file_url = CONCAT('pod-materials/', storage.objects.name)
    )
);

CREATE POLICY "Pod members can upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'pod-materials');

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_pods_updated_at
    BEFORE UPDATE ON public.pods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pod_notes_updated_at
    BEFORE UPDATE ON public.pod_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
-- Drop and recreate the handle_new_user function with correct type casting
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name)
  VALUES (
    new.id,
    CASE 
      WHEN (new.raw_user_meta_data ->> 'role') = 'teacher' THEN 'teacher'::user_role
      WHEN (new.raw_user_meta_data ->> 'role') = 'learner' THEN 'learner'::user_role
      ELSE 'learner'::user_role
    END,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$function$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Drop the trigger first, then the function, then recreate both
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name)
  VALUES (
    new.id,
    CASE 
      WHEN (new.raw_user_meta_data ->> 'role') = 'teacher' THEN 'teacher'::user_role
      WHEN (new.raw_user_meta_data ->> 'role') = 'learner' THEN 'learner'::user_role
      ELSE 'learner'::user_role
    END,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', '')
  );
  RETURN new;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Check if profiles table exists and is properly set up
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles';
-- Drop existing trigger and function completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert new profile with proper type casting
  INSERT INTO public.profiles (id, role, first_name, last_name)
  VALUES (
    NEW.id,
    CASE 
      WHEN (NEW.raw_user_meta_data ->> 'role') = 'teacher' THEN 'teacher'::user_role
      WHEN (NEW.raw_user_meta_data ->> 'role') = 'learner' THEN 'learner'::user_role
      ELSE 'learner'::user_role
    END,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and still return NEW to avoid blocking user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Add email and phone_number fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone_number text;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert new profile with proper type casting and email
  INSERT INTO public.profiles (id, role, first_name, last_name, email)
  VALUES (
    NEW.id,
    CASE 
      WHEN (NEW.raw_user_meta_data ->> 'role') = 'teacher' THEN 'teacher'::user_role
      WHEN (NEW.raw_user_meta_data ->> 'role') = 'learner' THEN 'learner'::user_role
      ELSE 'learner'::user_role
    END,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and still return NEW to avoid blocking user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Fix the infinite recursion issue in pod_members policies by creating a security definer function
CREATE OR REPLACE FUNCTION public.get_user_pod_role(user_id uuid, pod_id uuid)
RETURNS pod_member_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.pod_members WHERE user_id = $1 AND pod_id = $2 LIMIT 1;
$$;

-- Recreate the problematic policies for pod_members to avoid recursion
DROP POLICY IF EXISTS "Users can view pod members for pods they belong to" ON public.pod_members;
DROP POLICY IF EXISTS "Teachers can add members to their pods" ON public.pod_members;

CREATE POLICY "Users can view pod members for pods they belong to"
ON public.pod_members
FOR SELECT
USING (
  auth.uid() IN (
    SELECT pm.user_id 
    FROM public.pod_members pm 
    WHERE pm.pod_id = pod_members.pod_id
  )
);

CREATE POLICY "Teachers can add members to their pods"
ON public.pod_members
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT p.created_by
    FROM public.pods p
    WHERE p.id = pod_members.pod_id
  )
);
-- Create sessions table for tracking active/past learning sessions
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  started_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for real-time chat during sessions
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_ai BOOLEAN NOT NULL DEFAULT false,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notes table for AI-generated session summaries
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  generated_by_ai BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of answer options
  correct_answer INTEGER NOT NULL, -- Index of correct option
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz submissions table
CREATE TABLE public.quiz_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- Array of selected answers
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, student_id) -- One submission per student per quiz
);

-- Create subscriptions table for billing
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paypal_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'institution')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Pod members can view sessions" ON public.sessions
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM pod_members WHERE pod_id = sessions.pod_id
  ));

CREATE POLICY "Teachers can create sessions" ON public.sessions
  FOR INSERT WITH CHECK (
    auth.uid() = started_by AND 
    auth.uid() IN (SELECT user_id FROM pod_members WHERE pod_id = sessions.pod_id AND role = 'teacher')
  );

CREATE POLICY "Teachers can update their sessions" ON public.sessions
  FOR UPDATE USING (auth.uid() = started_by);

-- RLS Policies for messages
CREATE POLICY "Pod members can view messages" ON public.messages
  FOR SELECT USING (auth.uid() IN (
    SELECT pm.user_id FROM pod_members pm 
    JOIN sessions s ON s.pod_id = pm.pod_id 
    WHERE s.id = messages.session_id
  ));

CREATE POLICY "Pod members can create messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    auth.uid() IN (
      SELECT pm.user_id FROM pod_members pm 
      JOIN sessions s ON s.pod_id = pm.pod_id 
      WHERE s.id = messages.session_id
    )
  );

-- RLS Policies for notes
CREATE POLICY "Pod members can view notes" ON public.notes
  FOR SELECT USING (auth.uid() IN (
    SELECT pm.user_id FROM pod_members pm 
    JOIN sessions s ON s.pod_id = pm.pod_id 
    WHERE s.id = notes.session_id
  ));

CREATE POLICY "Teachers can create notes" ON public.notes
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND 
    auth.uid() IN (
      SELECT pm.user_id FROM pod_members pm 
      JOIN sessions s ON s.pod_id = pm.pod_id 
      WHERE s.id = notes.session_id AND pm.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update their notes" ON public.notes
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for quizzes
CREATE POLICY "Pod members can view published quizzes" ON public.quizzes
  FOR SELECT USING (
    is_published = true AND 
    auth.uid() IN (SELECT user_id FROM pod_members WHERE pod_id = quizzes.pod_id)
  );

CREATE POLICY "Teachers can manage their quizzes" ON public.quizzes
  FOR ALL USING (auth.uid() = created_by);

-- RLS Policies for quiz questions
CREATE POLICY "Users can view questions of accessible quizzes" ON public.quiz_questions
  FOR SELECT USING (auth.uid() IN (
    SELECT pm.user_id FROM pod_members pm 
    JOIN quizzes q ON q.pod_id = pm.pod_id 
    WHERE q.id = quiz_questions.quiz_id AND q.is_published = true
  ));

CREATE POLICY "Teachers can manage quiz questions" ON public.quiz_questions
  FOR ALL USING (auth.uid() IN (
    SELECT q.created_by FROM quizzes q WHERE q.id = quiz_questions.quiz_id
  ));

-- RLS Policies for quiz submissions
CREATE POLICY "Students can view their own submissions" ON public.quiz_submissions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own submissions" ON public.quiz_submissions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can view submissions for their quizzes" ON public.quiz_submissions
  FOR SELECT USING (auth.uid() IN (
    SELECT q.created_by FROM quizzes q WHERE q.id = quiz_submissions.quiz_id
  ));

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" ON public.subscriptions
  FOR ALL USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Fix infinite recursion in RLS policy for pod_members and harden membership checks across key policies

-- 1) Create a SECURITY DEFINER helper to check pod membership safely
create or replace function public.is_member_of_pod(_user_id uuid, _pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pod_members pm
    where pm.user_id = _user_id
      and pm.pod_id = _pod_id
  );
$$;

-- Make sure only authenticated users can execute it
revoke all on function public.is_member_of_pod(uuid, uuid) from public;
grant execute on function public.is_member_of_pod(uuid, uuid) to authenticated;

-- 2) Replace the recursive SELECT policy on pod_members
-- Drop existing policy if present
drop policy if exists "Users can view pod members for pods they belong to" on public.pod_members;

-- Recreate using the helper function (avoids self-referencing subquery)
create policy "Users can view pod members for pods they belong to"
  on public.pod_members
  for select
  using (
    public.is_member_of_pod(auth.uid(), pod_members.pod_id)
  );

-- 3) Reduce cross-table dependencies on pod_members in other policies where safe
-- Pods: simplify SELECT policy to use helper
drop policy if exists "Users can view pods they are members of" on public.pods;
create policy "Users can view pods they are members of"
  on public.pods
  for select
  using (
    public.is_member_of_pod(auth.uid(), pods.id)
  );

-- Sessions: simplify SELECT policy (membership check only)
drop policy if exists "Pod members can view sessions" on public.sessions;
create policy "Pod members can view sessions"
  on public.sessions
  for select
  using (
    public.is_member_of_pod(auth.uid(), sessions.pod_id)
  );

-- pod_whiteboards: update policies to use helper
-- Drop and recreate SELECT policy
drop policy if exists "Pod members can view whiteboards" on public.pod_whiteboards;
create policy "Pod members can view whiteboards"
  on public.pod_whiteboards
  for select
  using (
    public.is_member_of_pod(auth.uid(), pod_whiteboards.pod_id)
  );

-- Drop and recreate INSERT policy
drop policy if exists "Pod members can update whiteboards" on public.pod_whiteboards;
create policy "Pod members can update whiteboards"
  on public.pod_whiteboards
  for insert
  with check (
    auth.uid() = updated_by
    and public.is_member_of_pod(auth.uid(), pod_whiteboards.pod_id)
  );

-- Drop and recreate UPDATE policy
drop policy if exists "Pod members can modify whiteboards" on public.pod_whiteboards;
create policy "Pod members can modify whiteboards"
  on public.pod_whiteboards
  for update
  using (
    public.is_member_of_pod(auth.uid(), pod_whiteboards.pod_id)
  );

-- pod_materials: update policies to use helper
-- SELECT
drop policy if exists "Pod members can view materials" on public.pod_materials;
create policy "Pod members can view materials"
  on public.pod_materials
  for select
  using (
    public.is_member_of_pod(auth.uid(), pod_materials.pod_id)
  );

-- INSERT
drop policy if exists "Pod members can upload materials" on public.pod_materials;
create policy "Pod members can upload materials"
  on public.pod_materials
  for insert
  with check (
    auth.uid() = uploaded_by
    and public.is_member_of_pod(auth.uid(), pod_materials.pod_id)
  );

-- DELETE (uploader still owns delete)
drop policy if exists "Uploaders can delete their materials" on public.pod_materials;
create policy "Uploaders can delete their materials"
  on public.pod_materials
  for delete
  using (
    auth.uid() = uploaded_by
  );

-- pod_chats: update policies
drop policy if exists "Pod members can view chat messages" on public.pod_chats;
create policy "Pod members can view chat messages"
  on public.pod_chats
  for select
  using (
    public.is_member_of_pod(auth.uid(), pod_chats.pod_id)
  );

drop policy if exists "Pod members can send chat messages" on public.pod_chats;
create policy "Pod members can send chat messages"
  on public.pod_chats
  for insert
  with check (
    auth.uid() = user_id
    and public.is_member_of_pod(auth.uid(), pod_chats.pod_id)
  );

-- quizzes: relax to helper for published visibility
drop policy if exists "Pod members can view published quizzes" on public.quizzes;
create policy "Pod members can view published quizzes"
  on public.quizzes
  for select
  using (
    is_published = true
    and public.is_member_of_pod(auth.uid(), quizzes.pod_id)
  );

-- quiz_questions: keep teacher manage policy, adjust member visibility via helper
drop policy if exists "Users can view questions of accessible quizzes" on public.quiz_questions;
create policy "Users can view questions of accessible quizzes"
  on public.quiz_questions
  for select
  using (
    exists (
      select 1
      from public.quizzes q
      where q.id = quiz_questions.quiz_id
        and q.is_published = true
        and public.is_member_of_pod(auth.uid(), q.pod_id)
    )
  );

-- notes and messages policies involve session joins; these remain unchanged for now to avoid overreach.
-- This migration focuses on eliminating recursion and simplifying common membership checks.
-- Fix security warnings by setting search_path for all database functions

-- 1. Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id;
$function$;

-- 2. Fix get_user_pod_role function  
CREATE OR REPLACE FUNCTION public.get_user_pod_role(user_id uuid, pod_id uuid)
 RETURNS pod_member_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT role FROM public.pod_members WHERE user_id = $1 AND pod_id = $2 LIMIT 1;
$function$;

-- 3. Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Insert new profile with proper type casting and email
  INSERT INTO public.profiles (id, role, first_name, last_name, email)
  VALUES (
    NEW.id,
    CASE 
      WHEN (NEW.raw_user_meta_data ->> 'role') = 'teacher' THEN 'teacher'::user_role
      WHEN (NEW.raw_user_meta_data ->> 'role') = 'learner' THEN 'learner'::user_role
      ELSE 'learner'::user_role
    END,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and still return NEW to avoid blocking user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;
-- Fix the last function search path warning
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'learner')),
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'paid')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create pods table
CREATE TABLE public.pods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pod_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pod_members table
CREATE TABLE public.pod_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pod_id, user_id)
);

-- Create sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  ai_recap TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create session_messages table
CREATE TABLE public.session_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create materials table
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create projects table (paid tier only)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project_submissions table
CREATE TABLE public.project_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_url TEXT,
  submission_text TEXT,
  ai_feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create ai_actions table (track usage)
CREATE TABLE public.ai_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pod_id UUID REFERENCES public.pods(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('recap', 'quiz_generation', 'project_suggestion', 'contextual_qa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Pods policies
CREATE POLICY "Anyone can view pods they're a member of" ON public.pods FOR SELECT USING (
  auth.uid() = teacher_id OR 
  EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = pods.id AND user_id = auth.uid())
);
CREATE POLICY "Teachers can create pods" ON public.pods FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update own pods" ON public.pods FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can delete own pods" ON public.pods FOR DELETE USING (auth.uid() = teacher_id);

-- Pod members policies
CREATE POLICY "Anyone can view pod members" ON public.pod_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members pm WHERE pm.pod_id = pods.id AND pm.user_id = auth.uid())))
);
CREATE POLICY "Students can join pods" ON public.pod_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can leave pods" ON public.pod_members FOR DELETE USING (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Members can view pod sessions" ON public.sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = pods.id AND user_id = auth.uid())))
);
CREATE POLICY "Teachers can create sessions" ON public.sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);
CREATE POLICY "Teachers can update sessions" ON public.sessions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);

-- Session messages policies
CREATE POLICY "Members can view session messages" ON public.session_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sessions s 
    JOIN public.pods p ON s.pod_id = p.id 
    WHERE s.id = session_id AND (p.teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = p.id AND user_id = auth.uid()))
  )
);
CREATE POLICY "Members can create messages" ON public.session_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.sessions s 
    JOIN public.pods p ON s.pod_id = p.id 
    WHERE s.id = session_id AND (p.teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = p.id AND user_id = auth.uid()))
  )
);
CREATE POLICY "Teachers can update messages" ON public.session_messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.sessions s 
    JOIN public.pods p ON s.pod_id = p.id 
    WHERE s.id = session_id AND p.teacher_id = auth.uid()
  )
);

-- Materials policies
CREATE POLICY "Members can view materials" ON public.materials FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = pods.id AND user_id = auth.uid())))
);
CREATE POLICY "Teachers can upload materials" ON public.materials FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by AND EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);
CREATE POLICY "Teachers can delete materials" ON public.materials FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);

-- Quizzes policies
CREATE POLICY "Members can view published quizzes" ON public.quizzes FOR SELECT USING (
  published = true AND EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = pods.id AND user_id = auth.uid())))
);
CREATE POLICY "Teachers can view all quizzes" ON public.quizzes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);
CREATE POLICY "Teachers can create quizzes" ON public.quizzes FOR INSERT WITH CHECK (
  auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);
CREATE POLICY "Teachers can update quizzes" ON public.quizzes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);

-- Quiz attempts policies
CREATE POLICY "Users can view own attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view all attempts" ON public.quiz_attempts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q 
    JOIN public.pods p ON q.pod_id = p.id 
    WHERE q.id = quiz_id AND p.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can create attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Members can view projects" ON public.projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = pods.id AND user_id = auth.uid())))
);
CREATE POLICY "Teachers can create projects" ON public.projects FOR INSERT WITH CHECK (
  auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);
CREATE POLICY "Teachers can update projects" ON public.projects FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);

-- Project submissions policies
CREATE POLICY "Users can view own submissions" ON public.project_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view all submissions" ON public.project_submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects pr 
    JOIN public.pods p ON pr.pod_id = p.id 
    WHERE pr.id = project_id AND p.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can create submissions" ON public.project_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can update own submissions" ON public.project_submissions FOR UPDATE USING (auth.uid() = user_id);

-- AI actions policies
CREATE POLICY "Users can view own actions" ON public.ai_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create actions" ON public.ai_actions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'learner'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER pods_updated_at BEFORE UPDATE ON public.pods FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- Fix infinite recursion in RLS policies by using security definer functions

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Anyone can view pod members" ON public.pod_members;
DROP POLICY IF EXISTS "Anyone can view pods they're a member of" ON public.pods;
DROP POLICY IF EXISTS "Members can view pod sessions" ON public.sessions;
DROP POLICY IF EXISTS "Members can view session messages" ON public.session_messages;
DROP POLICY IF EXISTS "Members can create messages" ON public.session_messages;
DROP POLICY IF EXISTS "Members can view materials" ON public.materials;
DROP POLICY IF EXISTS "Members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view published quizzes" ON public.quizzes;

-- Create security definer function to check pod membership
CREATE OR REPLACE FUNCTION public.is_pod_member(_user_id uuid, _pod_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pod_members
    WHERE user_id = _user_id AND pod_id = _pod_id
  );
$$;

-- Create security definer function to check if user is pod teacher
CREATE OR REPLACE FUNCTION public.is_pod_teacher(_user_id uuid, _pod_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pods
    WHERE id = _pod_id AND teacher_id = _user_id
  );
$$;

-- Create security definer function to check pod access (teacher or member)
CREATE OR REPLACE FUNCTION public.has_pod_access(_user_id uuid, _pod_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_pod_teacher(_user_id, _pod_id) OR public.is_pod_member(_user_id, _pod_id);
$$;

-- Recreate policies using security definer functions

-- Pod members policies
CREATE POLICY "Users can view pod members"
ON public.pod_members
FOR SELECT
USING (public.has_pod_access(auth.uid(), pod_id));

-- Pods policies
CREATE POLICY "Users can view accessible pods"
ON public.pods
FOR SELECT
USING (public.has_pod_access(auth.uid(), id));

-- Sessions policies
CREATE POLICY "Users can view pod sessions"
ON public.sessions
FOR SELECT
USING (public.has_pod_access(auth.uid(), pod_id));

-- Session messages policies
CREATE POLICY "Users can view session messages"
ON public.session_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sessions
    WHERE sessions.id = session_messages.session_id
    AND public.has_pod_access(auth.uid(), sessions.pod_id)
  )
);

CREATE POLICY "Users can create session messages"
ON public.session_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.sessions
    WHERE sessions.id = session_messages.session_id
    AND public.has_pod_access(auth.uid(), sessions.pod_id)
  )
);

-- Materials policies
CREATE POLICY "Users can view pod materials"
ON public.materials
FOR SELECT
USING (public.has_pod_access(auth.uid(), pod_id));

-- Projects policies
CREATE POLICY "Users can view pod projects"
ON public.projects
FOR SELECT
USING (public.has_pod_access(auth.uid(), pod_id));

-- Quizzes policies
CREATE POLICY "Users can view published quizzes"
ON public.quizzes
FOR SELECT
USING (published = true AND public.has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Teachers can view all pod quizzes"
ON public.quizzes
FOR SELECT
USING (public.is_pod_teacher(auth.uid(), pod_id));
-- Add function to check if user has reached pod limit
CREATE OR REPLACE FUNCTION public.check_pod_limit(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE 
      -- Premium users have unlimited pods
      WHEN (SELECT tier FROM public.subscriptions WHERE user_id = _user_id) = 'premium' THEN true
      -- Free users can only have 1 pod
      ELSE (SELECT COUNT(*) FROM public.pods WHERE teacher_id = _user_id) < 1
    END;
$$;

-- Update pod creation policy to enforce limits
DROP POLICY IF EXISTS "Teachers can create pods" ON public.pods;

CREATE POLICY "Teachers can create pods" 
ON public.pods 
FOR INSERT 
WITH CHECK (
  auth.uid() = teacher_id AND 
  public.check_pod_limit(auth.uid())
);
-- Add new columns to profiles for enhanced user data
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS bio text;

-- Ensure avatar_url column exists (it already does per schema, but keep safe)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create public avatars bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
DO $$
BEGIN
  -- Public read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Avatar images are publicly accessible') THEN
    CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;

  -- User can upload to own folder
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own avatar') THEN
    CREATE POLICY "Users can upload their own avatar"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- User can update own avatar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own avatar') THEN
    CREATE POLICY "Users can update their own avatar"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- User can delete own avatar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own avatar') THEN
    CREATE POLICY "Users can delete their own avatar"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
-- Add public discoverability and join by code
-- 1) Add is_public column to pods
ALTER TABLE public.pods
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- 2) Allow authenticated users to view public pods in addition to pods they have access to
DO $$
BEGIN
  -- Create additional SELECT policy if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'pods' AND policyname = 'Users can view public pods'
  ) THEN
    CREATE POLICY "Users can view public pods"
    ON public.pods
    FOR SELECT
    USING (is_public = true);
  END IF;
END $$;

-- 3) Secure function to join a pod by code (works for private pods without exposing them)
CREATE OR REPLACE FUNCTION public.join_pod_with_code(code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pod_id uuid;
BEGIN
  SELECT id INTO _pod_id FROM public.pods WHERE pod_code = code LIMIT 1;
  IF _pod_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_CODE' USING HINT = 'No pod found for this code.';
  END IF;

  -- Insert membership if not already present
  INSERT INTO public.pod_members (user_id, pod_id)
  VALUES (auth.uid(), _pod_id)
  ON CONFLICT DO NOTHING;

  RETURN _pod_id;
END;
$$;

-- 4) Helpful index for discovery
CREATE INDEX IF NOT EXISTS idx_pods_public_search ON public.pods (is_public, title, subject);
-- Create learning_chats table for storing student AI chat sessions
CREATE TABLE public.learning_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create learning_messages table for storing individual messages
CREATE TABLE public.learning_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.learning_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_chats
CREATE POLICY "Users can view their own learning chats"
ON public.learning_chats
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own learning chats"
ON public.learning_chats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning chats"
ON public.learning_chats
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning chats"
ON public.learning_chats
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for learning_messages
CREATE POLICY "Users can view messages from their own chats"
ON public.learning_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.learning_chats
    WHERE learning_chats.id = learning_messages.chat_id
    AND learning_chats.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their own chats"
ON public.learning_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.learning_chats
    WHERE learning_chats.id = learning_messages.chat_id
    AND learning_chats.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages from their own chats"
ON public.learning_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.learning_chats
    WHERE learning_chats.id = learning_messages.chat_id
    AND learning_chats.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_learning_chats_updated_at
BEFORE UPDATE ON public.learning_chats
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX idx_learning_chats_user_id ON public.learning_chats(user_id);
CREATE INDEX idx_learning_messages_chat_id ON public.learning_messages(chat_id);
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
-- Fix search_path for phoenix session timestamp function
CREATE OR REPLACE FUNCTION public.update_phoenix_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;
-- Create pod_messages table for real-time chat
CREATE TABLE public.pod_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create pod_notes table for teacher notes (post-it style)
CREATE TABLE public.pod_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'yellow' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create pod_materials table for file uploads
CREATE TABLE public.pod_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('notes', 'past_papers', 'assignments')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create material_submissions table for student assignment submissions
CREATE TABLE public.material_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.pod_materials(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.pod_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pod_messages
CREATE POLICY "Pod members can view messages"
ON public.pod_messages FOR SELECT
USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Pod members can send messages"
ON public.pod_messages FOR INSERT
WITH CHECK (has_pod_access(auth.uid(), pod_id) AND auth.uid() = user_id);

-- RLS Policies for pod_notes
CREATE POLICY "Pod members can view notes"
ON public.pod_notes FOR SELECT
USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Teachers can create notes"
ON public.pod_notes FOR INSERT
WITH CHECK (is_pod_teacher(auth.uid(), pod_id) AND auth.uid() = created_by);

CREATE POLICY "Teachers can delete their notes"
ON public.pod_notes FOR DELETE
USING (is_pod_teacher(auth.uid(), pod_id) AND auth.uid() = created_by);

-- RLS Policies for pod_materials
CREATE POLICY "Pod members can view materials"
ON public.pod_materials FOR SELECT
USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Teachers can upload materials"
ON public.pod_materials FOR INSERT
WITH CHECK (is_pod_teacher(auth.uid(), pod_id) AND auth.uid() = uploaded_by);

CREATE POLICY "Teachers can delete their materials"
ON public.pod_materials FOR DELETE
USING (is_pod_teacher(auth.uid(), pod_id) AND auth.uid() = uploaded_by);

-- RLS Policies for material_submissions
CREATE POLICY "Students can view their own submissions"
ON public.material_submissions FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all submissions for their pod materials"
ON public.material_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pod_materials pm
    JOIN public.pods p ON pm.pod_id = p.id
    WHERE pm.id = material_submissions.material_id
    AND p.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can create submissions"
ON public.material_submissions FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Enable realtime for pod_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.pod_messages;

-- Create storage bucket for pod materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pod-materials',
  'pod-materials',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for pod materials
CREATE POLICY "Teachers can upload files to their pods"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pod-materials' AND
  EXISTS (
    SELECT 1 FROM public.pods
    WHERE id::text = (storage.foldername(name))[1]
    AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Pod members can download materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pod-materials' AND
  EXISTS (
    SELECT 1 FROM public.pods
    WHERE id::text = (storage.foldername(name))[1]
    AND has_pod_access(auth.uid(), id)
  )
);

CREATE POLICY "Students can upload assignment submissions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pod-materials' AND
  (storage.foldername(name))[2] = 'submissions' AND
  auth.uid()::text = (storage.foldername(name))[3]
);
-- Create whiteboards table for collaborative whiteboard functionality
CREATE TABLE public.whiteboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  whiteboard_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on whiteboards
ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;

-- Whiteboard policies
CREATE POLICY "Pod members can view whiteboards"
  ON public.whiteboards
  FOR SELECT
  USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Pod members can create whiteboards"
  ON public.whiteboards
  FOR INSERT
  WITH CHECK (has_pod_access(auth.uid(), pod_id) AND auth.uid() = created_by);

CREATE POLICY "Pod members can update whiteboards"
  ON public.whiteboards
  FOR UPDATE
  USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Creators can delete whiteboards"
  ON public.whiteboards
  FOR DELETE
  USING (auth.uid() = created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_whiteboards_updated_at
  BEFORE UPDATE ON public.whiteboards
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for whiteboards
ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboards;
-- Add missing foreign keys to stabilize relationships used by UI queries
-- Guard each addition to avoid errors if it already exists

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pod_messages_user_id_fkey'
  ) THEN
    ALTER TABLE public.pod_messages
      ADD CONSTRAINT pod_messages_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pod_messages_pod_id_fkey'
  ) THEN
    ALTER TABLE public.pod_messages
      ADD CONSTRAINT pod_messages_pod_id_fkey
      FOREIGN KEY (pod_id)
      REFERENCES public.pods(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pods_teacher_id_fkey'
  ) THEN
    ALTER TABLE public.pods
      ADD CONSTRAINT pods_teacher_id_fkey
      FOREIGN KEY (teacher_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_pod_messages_pod_id ON public.pod_messages(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_messages_user_id ON public.pod_messages(user_id);
-- Drop the existing check constraint on subscriptions tier
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

-- Add new check constraint that includes teacher_premium and student_premium
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_tier_check 
CHECK (tier IN ('free', 'premium', 'teacher_premium', 'student_premium'));
-- Update check_pod_limit function to recognize teacher_premium tier
CREATE OR REPLACE FUNCTION public.check_pod_limit(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      -- Premium teacher users have unlimited pods
      WHEN (SELECT tier FROM public.subscriptions WHERE user_id = _user_id) = 'teacher_premium' THEN true
      -- Free users can only have 1 pod
      ELSE (SELECT COUNT(*) FROM public.pods WHERE teacher_id = _user_id) < 1
    END;
$function$;
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
-- Allow all pod members to delete whiteboards (not just creators)
DROP POLICY IF EXISTS "Creators can delete whiteboards" ON public.whiteboards;

CREATE POLICY "Pod members can delete whiteboards" 
ON public.whiteboards 
FOR DELETE 
USING (has_pod_access(auth.uid(), pod_id));
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
-- Add archived column to pod_quizzes
ALTER TABLE pod_quizzes ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- Create live_meetings table for persisting active meeting rooms
CREATE TABLE IF NOT EXISTS live_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  started_by UUID NOT NULL REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT one_active_meeting_per_pod UNIQUE (pod_id, ended_at)
);

-- Enable RLS
ALTER TABLE live_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_meetings
CREATE POLICY "Pod members can view live meetings"
  ON live_meetings FOR SELECT
  USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Pod members can create live meetings"
  ON live_meetings FOR INSERT
  WITH CHECK (has_pod_access(auth.uid(), pod_id) AND auth.uid() = started_by);

CREATE POLICY "Meeting starter can end meetings"
  ON live_meetings FOR UPDATE
  USING (auth.uid() = started_by);

-- Update check_quiz_limit to count ALL quizzes (archived + active)
CREATE OR REPLACE FUNCTION public.check_quiz_limit(teacher_id uuid, pod_id uuid)
RETURNS boolean
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
  IF user_tier = 'teacher_premium' OR user_tier = 'premium' THEN
    RETURN true;
  END IF;
  
  -- Count ALL existing quizzes for this teacher (including archived)
  SELECT COUNT(*) INTO quiz_count
  FROM pod_quizzes
  WHERE created_by = teacher_id;
  
  -- Free tier: max 2 quizzes total
  RETURN quiz_count < 2;
END;
$$;

-- Enable realtime for live_meetings
ALTER PUBLICATION supabase_realtime ADD TABLE live_meetings;
-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'learner'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET email = NEW.email;
  
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Backfill existing profiles with email from auth.users
UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id
AND profiles.email IS NULL;
-- Update RLS policies for pod_notes to allow all pod members to create notes
DROP POLICY IF EXISTS "Teachers can create notes" ON public.pod_notes;

CREATE POLICY "Pod members can create notes"
ON public.pod_notes
FOR INSERT
WITH CHECK (
  has_pod_access(auth.uid(), pod_id) AND (auth.uid() = created_by)
);

-- Update RLS policies for pod_quizzes to allow all pod members to create quizzes
DROP POLICY IF EXISTS "Teachers can create quizzes" ON public.pod_quizzes;

CREATE POLICY "Pod members can create quizzes"
ON public.pod_quizzes
FOR INSERT
WITH CHECK (
  has_pod_access(auth.uid(), pod_id) AND (auth.uid() = created_by)
);
-- Create table for flashcard sets
CREATE TABLE IF NOT EXISTS public.pod_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  curriculum TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  card_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for individual flashcards
CREATE TABLE IF NOT EXISTS public.flashcard_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_set_id UUID NOT NULL REFERENCES public.pod_flashcards(id) ON DELETE CASCADE,
  hint TEXT NOT NULL,
  content TEXT NOT NULL,
  card_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pod_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pod_flashcards
CREATE POLICY "Pod members can view flashcards"
ON public.pod_flashcards
FOR SELECT
USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Pod members can create flashcards"
ON public.pod_flashcards
FOR INSERT
WITH CHECK (has_pod_access(auth.uid(), pod_id) AND auth.uid() = created_by);

CREATE POLICY "Creators can delete their flashcards"
ON public.pod_flashcards
FOR DELETE
USING (auth.uid() = created_by);

-- RLS Policies for flashcard_cards
CREATE POLICY "Users can view flashcard cards"
ON public.flashcard_cards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pod_flashcards pf
    WHERE pf.id = flashcard_cards.flashcard_set_id
    AND has_pod_access(auth.uid(), pf.pod_id)
  )
);

CREATE POLICY "Users can create flashcard cards"
ON public.flashcard_cards
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pod_flashcards pf
    WHERE pf.id = flashcard_cards.flashcard_set_id
    AND auth.uid() = pf.created_by
  )
);

-- Create indexes for performance
CREATE INDEX idx_pod_flashcards_pod_id ON public.pod_flashcards(pod_id);
CREATE INDEX idx_pod_flashcards_created_by ON public.pod_flashcards(created_by);
CREATE INDEX idx_flashcard_cards_set_id ON public.flashcard_cards(flashcard_set_id);
CREATE INDEX idx_flashcard_cards_order ON public.flashcard_cards(flashcard_set_id, card_order);
-- Fix RLS policy for pod_notes deletion
-- Allow teachers to delete any notes OR users to delete their own notes
DROP POLICY IF EXISTS "Teachers can delete their notes" ON public.pod_notes;

CREATE POLICY "Users can delete own notes or teachers can delete all"
ON public.pod_notes
FOR DELETE
USING (
  is_pod_teacher(auth.uid(), pod_id) OR (auth.uid() = created_by)
);
-- Allow teachers to remove students from their pods
CREATE POLICY "Teachers can remove students from their pods"
ON public.pod_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.pods
    WHERE pods.id = pod_members.pod_id
    AND pods.teacher_id = auth.uid()
  )
);
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
-- Create storage bucket for teaching resources
INSERT INTO storage.buckets (id, name, public) 
VALUES ('teaching-resources', 'teaching-resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view teaching resource files"
ON storage.objects FOR SELECT
USING (bucket_id = 'teaching-resources');

CREATE POLICY "Teachers can upload teaching resource files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'teaching-resources' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
-- Create the updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for storing assistant conversations
CREATE TABLE public.assistant_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversations
CREATE POLICY "Users can view their own conversations"
ON public.assistant_conversations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own conversations
CREATE POLICY "Users can create their own conversations"
ON public.assistant_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update their own conversations"
ON public.assistant_conversations
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users can delete their own conversations"
ON public.assistant_conversations
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_assistant_conversations_updated_at
BEFORE UPDATE ON public.assistant_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create educator_messages table for learner-educator communication
CREATE TABLE public.educator_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  educator_id UUID NOT NULL,
  learner_id UUID NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.educator_messages ENABLE ROW LEVEL SECURITY;

-- Learners can send messages to educators
CREATE POLICY "Learners can send messages"
ON public.educator_messages
FOR INSERT
WITH CHECK (auth.uid() = learner_id);

-- Learners can view their own sent messages
CREATE POLICY "Learners can view their sent messages"
ON public.educator_messages
FOR SELECT
USING (auth.uid() = learner_id);

-- Educators can view messages sent to them
CREATE POLICY "Educators can view their received messages"
ON public.educator_messages
FOR SELECT
USING (auth.uid() = educator_id);

-- Educators can update messages (mark read, add reply)
CREATE POLICY "Educators can update their received messages"
ON public.educator_messages
FOR UPDATE
USING (auth.uid() = educator_id);

-- Create function to check if educator has Teach+ subscription
CREATE OR REPLACE FUNCTION public.is_teach_plus_educator(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = _user_id
      AND tier = 'teacher_premium'
      AND status = 'active'
  );
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_educator_messages_updated_at
BEFORE UPDATE ON public.educator_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_educator_messages_educator_id ON public.educator_messages(educator_id);
CREATE INDEX idx_educator_messages_learner_id ON public.educator_messages(learner_id);
CREATE INDEX idx_educator_messages_is_read ON public.educator_messages(is_read);
