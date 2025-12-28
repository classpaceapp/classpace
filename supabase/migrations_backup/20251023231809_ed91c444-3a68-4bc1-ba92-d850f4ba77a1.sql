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
