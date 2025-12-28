-- Create whiteboards table for collaborative whiteboard functionality
CREATE TABLE public.whiteboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  whiteboard_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on whiteboards
ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;

-- Whiteboard policies
CREATE POLICY "Pod members can view whiteboards"
  ON public.whiteboards
  FOR SELECT
  USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Pod members can create whiteboards"
  ON public.whiteboards
  FOR INSERT
  WITH CHECK (has_pod_access(auth.uid(), pod_id) AND auth.uid() = created_by);

CREATE POLICY "Pod members can update whiteboards"
  ON public.whiteboards
  FOR UPDATE
  USING (has_pod_access(auth.uid(), pod_id));

CREATE POLICY "Creators can delete whiteboards"
  ON public.whiteboards
  FOR DELETE
  USING (auth.uid() = created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_whiteboards_updated_at
  BEFORE UPDATE ON public.whiteboards
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for whiteboards
ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboards;