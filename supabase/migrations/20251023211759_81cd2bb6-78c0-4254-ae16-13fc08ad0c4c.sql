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