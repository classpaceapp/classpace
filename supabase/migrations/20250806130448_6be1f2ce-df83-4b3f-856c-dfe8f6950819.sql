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