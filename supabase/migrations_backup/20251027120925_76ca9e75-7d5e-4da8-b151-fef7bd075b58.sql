-- Fix search_path for phoenix session timestamp function
CREATE OR REPLACE FUNCTION public.update_phoenix_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;