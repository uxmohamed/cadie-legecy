-- Add extracted/plain content text storage for link search and previews.
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS content_text text;
