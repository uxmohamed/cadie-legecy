-- Migration: Add comprehensive metadata columns to links table
-- Created: 2025-12-07
-- Purpose: Support production-grade link metadata extraction

-- URL-level data
ALTER TABLE links ADD COLUMN IF NOT EXISTS final_url TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS site_name TEXT;

-- Visual identity
ALTER TABLE links ADD COLUMN IF NOT EXISTS favicon_variants JSONB DEFAULT '[]';
ALTER TABLE links ADD COLUMN IF NOT EXISTS preview_image_width INTEGER;
ALTER TABLE links ADD COLUMN IF NOT EXISTS preview_image_height INTEGER;
ALTER TABLE links ADD COLUMN IF NOT EXISTS theme_color TEXT;

-- Content signals
ALTER TABLE links ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS word_count INTEGER;
ALTER TABLE links ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER;

-- System info / fetch tracking
ALTER TABLE links ADD COLUMN IF NOT EXISTS status_code INTEGER;
ALTER TABLE links ADD COLUMN IF NOT EXISTS fetch_status TEXT DEFAULT 'pending';
ALTER TABLE links ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMPTZ;
ALTER TABLE links ADD COLUMN IF NOT EXISTS etag TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS last_modified TEXT;

-- Add index for fetch_status to quickly find pending items for background processing
CREATE INDEX IF NOT EXISTS idx_links_fetch_status ON links(fetch_status) WHERE fetch_status = 'pending';

-- Add index for canonical_url for deduplication queries
CREATE INDEX IF NOT EXISTS idx_links_canonical_url ON links(canonical_url) WHERE canonical_url IS NOT NULL;

-- Comment on new columns for documentation
COMMENT ON COLUMN links.final_url IS 'URL after redirects, if different from original';
COMMENT ON COLUMN links.canonical_url IS 'Canonical URL from <link rel="canonical">';
COMMENT ON COLUMN links.site_name IS 'Site name from og:site_name';
COMMENT ON COLUMN links.favicon_variants IS 'Array of all discovered favicon variants with sizes/types';
COMMENT ON COLUMN links.preview_image_width IS 'Width of preview image from og:image:width';
COMMENT ON COLUMN links.preview_image_height IS 'Height of preview image from og:image:height';
COMMENT ON COLUMN links.theme_color IS 'Brand/accent color from meta theme-color';
COMMENT ON COLUMN links.language IS 'Page language from html lang attribute';
COMMENT ON COLUMN links.word_count IS 'Estimated word count of visible text';
COMMENT ON COLUMN links.reading_time_minutes IS 'Estimated reading time in minutes';
COMMENT ON COLUMN links.status_code IS 'HTTP status code from fetch';
COMMENT ON COLUMN links.fetch_status IS 'Metadata fetch status: pending, fetching, success, timeout, blocked, invalid_ssl, invalid_html, failed';
COMMENT ON COLUMN links.fetched_at IS 'Timestamp of last metadata fetch';
COMMENT ON COLUMN links.etag IS 'ETag header for re-fetch optimization';
COMMENT ON COLUMN links.last_modified IS 'Last-Modified header for re-fetch optimization';
