-- Create educator_messages table for learner-educator communication
CREATE TABLE public.educator_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  educator_id UUID NOT NULL,
  learner_id UUID NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.educator_messages ENABLE ROW LEVEL SECURITY;

-- Learners can send messages to educators
CREATE POLICY "Learners can send messages"
ON public.educator_messages
FOR INSERT
WITH CHECK (auth.uid() = learner_id);

-- Learners can view their own sent messages
CREATE POLICY "Learners can view their sent messages"
ON public.educator_messages
FOR SELECT
USING (auth.uid() = learner_id);

-- Educators can view messages sent to them
CREATE POLICY "Educators can view their received messages"
ON public.educator_messages
FOR SELECT
USING (auth.uid() = educator_id);

-- Educators can update messages (mark read, add reply)
CREATE POLICY "Educators can update their received messages"
ON public.educator_messages
FOR UPDATE
USING (auth.uid() = educator_id);

-- Create function to check if educator has Teach+ subscription
CREATE OR REPLACE FUNCTION public.is_teach_plus_educator(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = _user_id
      AND tier = 'teacher_premium'
      AND status = 'active'
  );
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_educator_messages_updated_at
BEFORE UPDATE ON public.educator_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_educator_messages_educator_id ON public.educator_messages(educator_id);
CREATE INDEX idx_educator_messages_learner_id ON public.educator_messages(learner_id);
CREATE INDEX idx_educator_messages_is_read ON public.educator_messages(is_read);