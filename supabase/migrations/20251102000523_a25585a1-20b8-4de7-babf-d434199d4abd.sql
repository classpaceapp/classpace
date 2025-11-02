-- Update RLS policies for pod_notes to allow all pod members to create notes
DROP POLICY IF EXISTS "Teachers can create notes" ON public.pod_notes;

CREATE POLICY "Pod members can create notes"
ON public.pod_notes
FOR INSERT
WITH CHECK (
  has_pod_access(auth.uid(), pod_id) AND (auth.uid() = created_by)
);

-- Update RLS policies for pod_quizzes to allow all pod members to create quizzes
DROP POLICY IF EXISTS "Teachers can create quizzes" ON public.pod_quizzes;

CREATE POLICY "Pod members can create quizzes"
ON public.pod_quizzes
FOR INSERT
WITH CHECK (
  has_pod_access(auth.uid(), pod_id) AND (auth.uid() = created_by)
);