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