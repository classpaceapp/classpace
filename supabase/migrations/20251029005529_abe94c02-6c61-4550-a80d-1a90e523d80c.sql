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