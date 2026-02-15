-- Create documents bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload only to their own folder: /{user_id}/...
CREATE POLICY "Users can upload own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public can read documents (URLs are public)
CREATE POLICY "Documents are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Users can delete only their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
