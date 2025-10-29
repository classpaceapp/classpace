-- Allow all pod members to delete whiteboards (not just creators)
DROP POLICY IF EXISTS "Creators can delete whiteboards" ON public.whiteboards;

CREATE POLICY "Pod members can delete whiteboards" 
ON public.whiteboards 
FOR DELETE 
USING (has_pod_access(auth.uid(), pod_id));