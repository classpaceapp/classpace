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