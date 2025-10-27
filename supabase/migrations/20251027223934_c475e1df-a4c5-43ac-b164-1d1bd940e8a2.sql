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
