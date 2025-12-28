-- Create storage bucket for teaching resources
INSERT INTO storage.buckets (id, name, public) 
VALUES ('teaching-resources', 'teaching-resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view teaching resource files"
ON storage.objects FOR SELECT
USING (bucket_id = 'teaching-resources');

CREATE POLICY "Teachers can upload teaching resource files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'teaching-resources' AND
  auth.uid()::text = (storage.foldername(name))[1]
);