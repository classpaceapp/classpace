-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'learner')),
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'paid')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create pods table
CREATE TABLE public.pods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pod_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pod_members table
CREATE TABLE public.pod_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pod_id, user_id)
);

-- Create sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  ai_recap TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create session_messages table
CREATE TABLE public.session_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create materials table
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create projects table (paid tier only)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project_submissions table
CREATE TABLE public.project_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_url TEXT,
  submission_text TEXT,
  ai_feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create ai_actions table (track usage)
CREATE TABLE public.ai_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pod_id UUID REFERENCES public.pods(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('recap', 'quiz_generation', 'project_suggestion', 'contextual_qa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Pods policies
CREATE POLICY "Anyone can view pods they're a member of" ON public.pods FOR SELECT USING (
  auth.uid() = teacher_id OR 
  EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = pods.id AND user_id = auth.uid())
);
CREATE POLICY "Teachers can create pods" ON public.pods FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update own pods" ON public.pods FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can delete own pods" ON public.pods FOR DELETE USING (auth.uid() = teacher_id);

-- Pod members policies
CREATE POLICY "Anyone can view pod members" ON public.pod_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members pm WHERE pm.pod_id = pods.id AND pm.user_id = auth.uid())))
);
CREATE POLICY "Students can join pods" ON public.pod_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can leave pods" ON public.pod_members FOR DELETE USING (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Members can view pod sessions" ON public.sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = pods.id AND user_id = auth.uid())))
);
CREATE POLICY "Teachers can create sessions" ON public.sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);
CREATE POLICY "Teachers can update sessions" ON public.sessions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);

-- Session messages policies
CREATE POLICY "Members can view session messages" ON public.session_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sessions s 
    JOIN public.pods p ON s.pod_id = p.id 
    WHERE s.id = session_id AND (p.teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = p.id AND user_id = auth.uid()))
  )
);
CREATE POLICY "Members can create messages" ON public.session_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.sessions s 
    JOIN public.pods p ON s.pod_id = p.id 
    WHERE s.id = session_id AND (p.teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = p.id AND user_id = auth.uid()))
  )
);
CREATE POLICY "Teachers can update messages" ON public.session_messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.sessions s 
    JOIN public.pods p ON s.pod_id = p.id 
    WHERE s.id = session_id AND p.teacher_id = auth.uid()
  )
);

-- Materials policies
CREATE POLICY "Members can view materials" ON public.materials FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = pods.id AND user_id = auth.uid())))
);
CREATE POLICY "Teachers can upload materials" ON public.materials FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by AND EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);
CREATE POLICY "Teachers can delete materials" ON public.materials FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);

-- Quizzes policies
CREATE POLICY "Members can view published quizzes" ON public.quizzes FOR SELECT USING (
  published = true AND EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = pods.id AND user_id = auth.uid())))
);
CREATE POLICY "Teachers can view all quizzes" ON public.quizzes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);
CREATE POLICY "Teachers can create quizzes" ON public.quizzes FOR INSERT WITH CHECK (
  auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);
CREATE POLICY "Teachers can update quizzes" ON public.quizzes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);

-- Quiz attempts policies
CREATE POLICY "Users can view own attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view all attempts" ON public.quiz_attempts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q 
    JOIN public.pods p ON q.pod_id = p.id 
    WHERE q.id = quiz_id AND p.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can create attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Members can view projects" ON public.projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pod_members WHERE pod_id = pods.id AND user_id = auth.uid())))
);
CREATE POLICY "Teachers can create projects" ON public.projects FOR INSERT WITH CHECK (
  auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);
CREATE POLICY "Teachers can update projects" ON public.projects FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.pods WHERE id = pod_id AND teacher_id = auth.uid())
);

-- Project submissions policies
CREATE POLICY "Users can view own submissions" ON public.project_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view all submissions" ON public.project_submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects pr 
    JOIN public.pods p ON pr.pod_id = p.id 
    WHERE pr.id = project_id AND p.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can create submissions" ON public.project_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can update own submissions" ON public.project_submissions FOR UPDATE USING (auth.uid() = user_id);

-- AI actions policies
CREATE POLICY "Users can view own actions" ON public.ai_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create actions" ON public.ai_actions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'learner'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER pods_updated_at BEFORE UPDATE ON public.pods FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();