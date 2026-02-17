-- V0 browser bookmark import jobs
CREATE TABLE IF NOT EXISTS public.bookmark_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('draft', 'queued', 'processing', 'completed', 'failed', 'expired')),
  storage_path text NOT NULL,
  original_filename text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0),
  folder_mode text NULL CHECK (folder_mode IN ('single_space', 'manual_map', 'auto_create_spaces')),
  single_space_id uuid NULL REFERENCES public.spaces(id) ON DELETE SET NULL,
  folder_to_space_map jsonb NULL,
  fallback_space_id uuid NULL REFERENCES public.spaces(id) ON DELETE SET NULL,
  preview_total_links integer NOT NULL DEFAULT 0,
  preview_invalid_links integer NOT NULL DEFAULT 0,
  preview_top_folders jsonb NOT NULL DEFAULT '[]'::jsonb,
  preview_sample_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  processed_links integer NOT NULL DEFAULT 0,
  created_links integer NOT NULL DEFAULT 0,
  restored_links integer NOT NULL DEFAULT 0,
  duplicate_links integer NOT NULL DEFAULT 0,
  invalid_links integer NOT NULL DEFAULT 0,
  space_attached_existing_links integer NOT NULL DEFAULT 0,
  error_message text NULL,
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookmark_import_jobs_user_created_at
  ON public.bookmark_import_jobs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookmark_import_jobs_status_created_at
  ON public.bookmark_import_jobs(status, created_at DESC);

ALTER TABLE public.bookmark_import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own import jobs" ON public.bookmark_import_jobs;
CREATE POLICY "Users can read own import jobs"
  ON public.bookmark_import_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can create own import jobs" ON public.bookmark_import_jobs;
CREATE POLICY "Users can create own import jobs"
  ON public.bookmark_import_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own import jobs" ON public.bookmark_import_jobs;
CREATE POLICY "Users can update own import jobs"
  ON public.bookmark_import_jobs
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own import jobs" ON public.bookmark_import_jobs;
CREATE POLICY "Users can delete own import jobs"
  ON public.bookmark_import_jobs
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Private import files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('imports', 'imports', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own import files" ON storage.objects;
CREATE POLICY "Users can upload own import files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'imports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can read own import files" ON storage.objects;
CREATE POLICY "Users can read own import files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'imports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own import files" ON storage.objects;
CREATE POLICY "Users can delete own import files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'imports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
