-- Fix RLS policy for pod_notes deletion
-- Allow teachers to delete any notes OR users to delete their own notes
DROP POLICY IF EXISTS "Teachers can delete their notes" ON public.pod_notes;

CREATE POLICY "Users can delete own notes or teachers can delete all"
ON public.pod_notes
FOR DELETE
USING (
  is_pod_teacher(auth.uid(), pod_id) OR (auth.uid() = created_by)
);