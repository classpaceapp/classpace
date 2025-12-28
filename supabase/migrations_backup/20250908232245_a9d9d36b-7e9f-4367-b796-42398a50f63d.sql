-- Create sessions table for tracking active/past learning sessions
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  started_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for real-time chat during sessions
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_ai BOOLEAN NOT NULL DEFAULT false,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notes table for AI-generated session summaries
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  generated_by_ai BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of answer options
  correct_answer INTEGER NOT NULL, -- Index of correct option
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz submissions table
CREATE TABLE public.quiz_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- Array of selected answers
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, student_id) -- One submission per student per quiz
);

-- Create subscriptions table for billing
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paypal_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'institution')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Pod members can view sessions" ON public.sessions
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM pod_members WHERE pod_id = sessions.pod_id
  ));

CREATE POLICY "Teachers can create sessions" ON public.sessions
  FOR INSERT WITH CHECK (
    auth.uid() = started_by AND 
    auth.uid() IN (SELECT user_id FROM pod_members WHERE pod_id = sessions.pod_id AND role = 'teacher')
  );

CREATE POLICY "Teachers can update their sessions" ON public.sessions
  FOR UPDATE USING (auth.uid() = started_by);

-- RLS Policies for messages
CREATE POLICY "Pod members can view messages" ON public.messages
  FOR SELECT USING (auth.uid() IN (
    SELECT pm.user_id FROM pod_members pm 
    JOIN sessions s ON s.pod_id = pm.pod_id 
    WHERE s.id = messages.session_id
  ));

CREATE POLICY "Pod members can create messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    auth.uid() IN (
      SELECT pm.user_id FROM pod_members pm 
      JOIN sessions s ON s.pod_id = pm.pod_id 
      WHERE s.id = messages.session_id
    )
  );

-- RLS Policies for notes
CREATE POLICY "Pod members can view notes" ON public.notes
  FOR SELECT USING (auth.uid() IN (
    SELECT pm.user_id FROM pod_members pm 
    JOIN sessions s ON s.pod_id = pm.pod_id 
    WHERE s.id = notes.session_id
  ));

CREATE POLICY "Teachers can create notes" ON public.notes
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND 
    auth.uid() IN (
      SELECT pm.user_id FROM pod_members pm 
      JOIN sessions s ON s.pod_id = pm.pod_id 
      WHERE s.id = notes.session_id AND pm.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update their notes" ON public.notes
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for quizzes
CREATE POLICY "Pod members can view published quizzes" ON public.quizzes
  FOR SELECT USING (
    is_published = true AND 
    auth.uid() IN (SELECT user_id FROM pod_members WHERE pod_id = quizzes.pod_id)
  );

CREATE POLICY "Teachers can manage their quizzes" ON public.quizzes
  FOR ALL USING (auth.uid() = created_by);

-- RLS Policies for quiz questions
CREATE POLICY "Users can view questions of accessible quizzes" ON public.quiz_questions
  FOR SELECT USING (auth.uid() IN (
    SELECT pm.user_id FROM pod_members pm 
    JOIN quizzes q ON q.pod_id = pm.pod_id 
    WHERE q.id = quiz_questions.quiz_id AND q.is_published = true
  ));

CREATE POLICY "Teachers can manage quiz questions" ON public.quiz_questions
  FOR ALL USING (auth.uid() IN (
    SELECT q.created_by FROM quizzes q WHERE q.id = quiz_questions.quiz_id
  ));

-- RLS Policies for quiz submissions
CREATE POLICY "Students can view their own submissions" ON public.quiz_submissions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own submissions" ON public.quiz_submissions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can view submissions for their quizzes" ON public.quiz_submissions
  FOR SELECT USING (auth.uid() IN (
    SELECT q.created_by FROM quizzes q WHERE q.id = quiz_submissions.quiz_id
  ));

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" ON public.subscriptions
  FOR ALL USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();