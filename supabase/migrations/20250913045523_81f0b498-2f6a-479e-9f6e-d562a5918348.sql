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