-- Allow teachers to remove students from their pods
CREATE POLICY "Teachers can remove students from their pods"
ON public.pod_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.pods
    WHERE pods.id = pod_members.pod_id
    AND pods.teacher_id = auth.uid()
  )
);