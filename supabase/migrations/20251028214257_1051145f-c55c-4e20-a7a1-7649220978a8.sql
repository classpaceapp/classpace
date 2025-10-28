-- Drop the existing check constraint on subscriptions tier
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

-- Add new check constraint that includes teacher_premium and student_premium
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_tier_check 
CHECK (tier IN ('free', 'premium', 'teacher_premium', 'student_premium'));