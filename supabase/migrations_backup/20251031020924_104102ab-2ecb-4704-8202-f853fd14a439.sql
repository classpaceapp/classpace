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