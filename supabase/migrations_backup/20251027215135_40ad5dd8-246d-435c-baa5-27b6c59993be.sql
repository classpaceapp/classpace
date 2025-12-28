-- Create pod_messages table for real-time chat
CREATE TABLE public.pod_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create pod_notes table for teacher notes (post-it style)
CREATE TABLE public.pod_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'yellow' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create pod_materials table for file uploads
CREATE TABLE public.pod_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('notes', 'past_papers', 'assignments')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create material_submissions table for student assignment submissions
CREATE TABLE public.material_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.pod_materials(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.pod_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pod_messages
CREATE POLICY "Pod members can view messages"
ON public.pod_messages FOR SELECT
USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Pod members can send messages"
ON public.pod_messages FOR INSERT
WITH CHECK (has_pod_access(auth.uid(), pod_id) AND auth.uid() = user_id);

-- RLS Policies for pod_notes
CREATE POLICY "Pod members can view notes"
ON public.pod_notes FOR SELECT
USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Teachers can create notes"
ON public.pod_notes FOR INSERT
WITH CHECK (is_pod_teacher(auth.uid(), pod_id) AND auth.uid() = created_by);

CREATE POLICY "Teachers can delete their notes"
ON public.pod_notes FOR DELETE
USING (is_pod_teacher(auth.uid(), pod_id) AND auth.uid() = created_by);

-- RLS Policies for pod_materials
CREATE POLICY "Pod members can view materials"
ON public.pod_materials FOR SELECT
USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Teachers can upload materials"
ON public.pod_materials FOR INSERT
WITH CHECK (is_pod_teacher(auth.uid(), pod_id) AND auth.uid() = uploaded_by);

CREATE POLICY "Teachers can delete their materials"
ON public.pod_materials FOR DELETE
USING (is_pod_teacher(auth.uid(), pod_id) AND auth.uid() = uploaded_by);

-- RLS Policies for material_submissions
CREATE POLICY "Students can view their own submissions"
ON public.material_submissions FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all submissions for their pod materials"
ON public.material_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pod_materials pm
    JOIN public.pods p ON pm.pod_id = p.id
    WHERE pm.id = material_submissions.material_id
    AND p.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can create submissions"
ON public.material_submissions FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Enable realtime for pod_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.pod_messages;

-- Create storage bucket for pod materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pod-materials',
  'pod-materials',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for pod materials
CREATE POLICY "Teachers can upload files to their pods"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pod-materials' AND
  EXISTS (
    SELECT 1 FROM public.pods
    WHERE id::text = (storage.foldername(name))[1]
    AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Pod members can download materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pod-materials' AND
  EXISTS (
    SELECT 1 FROM public.pods
    WHERE id::text = (storage.foldername(name))[1]
    AND has_pod_access(auth.uid(), id)
  )
);

CREATE POLICY "Students can upload assignment submissions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pod-materials' AND
  (storage.foldername(name))[2] = 'submissions' AND
  auth.uid()::text = (storage.foldername(name))[3]
);