-- Create comprehensive schema for Classpace

-- Create custom types
CREATE TYPE user_role AS ENUM ('teacher', 'learner');
CREATE TYPE pod_member_role AS ENUM ('teacher', 'student');
CREATE TYPE ai_activity_type AS ENUM ('summary', 'quiz', 'question', 'timeline', 'explanation');
CREATE TYPE file_type AS ENUM ('pdf', 'docx', 'png', 'jpg', 'jpeg', 'mp4', 'pptx', 'txt');

-- Create pods table
CREATE TABLE public.pods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    grade_level TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pod_members table
CREATE TABLE public.pod_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role pod_member_role NOT NULL DEFAULT 'student',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(pod_id, user_id)
);

-- Create pod_chats table
CREATE TABLE public.pod_chats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pod_notes table
CREATE TABLE public.pod_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pod_materials table
CREATE TABLE public.pod_materials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type file_type NOT NULL,
    file_size BIGINT,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pod_whiteboards table
CREATE TABLE public.pod_whiteboards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    whiteboard_data JSONB NOT NULL DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create ai_activity_logs table
CREATE TABLE public.ai_activity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type ai_activity_type NOT NULL,
    input_text TEXT NOT NULL,
    output_text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pods
CREATE POLICY "Users can view pods they are members of" ON public.pods
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pods.id
    )
);

CREATE POLICY "Teachers can create pods" ON public.pods
FOR INSERT WITH CHECK (
    auth.uid() = created_by AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);

CREATE POLICY "Pod creators can update their pods" ON public.pods
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Pod creators can delete their pods" ON public.pods
FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for pod_members
CREATE POLICY "Users can view pod members for pods they belong to" ON public.pod_members
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members pm WHERE pm.pod_id = pod_members.pod_id
    )
);

CREATE POLICY "Teachers can add members to their pods" ON public.pod_members
FOR INSERT WITH CHECK (
    auth.uid() IN (
        SELECT created_by FROM public.pods WHERE id = pod_id
    )
);

CREATE POLICY "Teachers can remove members from their pods" ON public.pod_members
FOR DELETE USING (
    auth.uid() IN (
        SELECT created_by FROM public.pods WHERE id = pod_id
    ) OR auth.uid() = user_id
);

-- Create RLS policies for pod_chats
CREATE POLICY "Pod members can view chat messages" ON public.pod_chats
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_chats.pod_id
    )
);

CREATE POLICY "Pod members can send chat messages" ON public.pod_chats
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_chats.pod_id
    )
);

-- Create RLS policies for pod_notes
CREATE POLICY "Pod members can view notes" ON public.pod_notes
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_notes.pod_id
    )
);

CREATE POLICY "Teachers can create notes" ON public.pod_notes
FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    auth.uid() IN (
        SELECT pm.user_id FROM public.pod_members pm 
        WHERE pm.pod_id = pod_notes.pod_id AND pm.role = 'teacher'
    )
);

CREATE POLICY "Note creators can update their notes" ON public.pod_notes
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Note creators can delete their notes" ON public.pod_notes
FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for pod_materials
CREATE POLICY "Pod members can view materials" ON public.pod_materials
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_materials.pod_id
    )
);

CREATE POLICY "Pod members can upload materials" ON public.pod_materials
FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_materials.pod_id
    )
);

CREATE POLICY "Uploaders can delete their materials" ON public.pod_materials
FOR DELETE USING (auth.uid() = uploaded_by);

-- Create RLS policies for pod_whiteboards
CREATE POLICY "Pod members can view whiteboards" ON public.pod_whiteboards
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_whiteboards.pod_id
    )
);

CREATE POLICY "Pod members can update whiteboards" ON public.pod_whiteboards
FOR INSERT WITH CHECK (
    auth.uid() = updated_by AND
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_whiteboards.pod_id
    )
);

CREATE POLICY "Pod members can modify whiteboards" ON public.pod_whiteboards
FOR UPDATE USING (
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = pod_whiteboards.pod_id
    )
);

-- Create RLS policies for ai_activity_logs
CREATE POLICY "Users can view their own AI activity" ON public.ai_activity_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI activity logs" ON public.ai_activity_logs
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
        SELECT user_id FROM public.pod_members WHERE pod_id = ai_activity_logs.pod_id
    )
);

-- Create storage bucket for pod materials
INSERT INTO storage.buckets (id, name, public) VALUES ('pod-materials', 'pod-materials', false);

-- Create storage policies
CREATE POLICY "Pod members can view files" ON storage.objects
FOR SELECT USING (
    bucket_id = 'pod-materials' AND
    auth.uid() IN (
        SELECT pm.user_id FROM public.pod_members pm
        JOIN public.pod_materials mat ON mat.pod_id = pm.pod_id
        WHERE mat.file_url = CONCAT('pod-materials/', storage.objects.name)
    )
);

CREATE POLICY "Pod members can upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'pod-materials');

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_pods_updated_at
    BEFORE UPDATE ON public.pods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pod_notes_updated_at
    BEFORE UPDATE ON public.pod_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);