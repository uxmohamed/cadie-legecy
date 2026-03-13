-- Benchmark the current links hot path against a real Supabase/Postgres dataset.
--
-- Usage:
-- 1. Replace the sample values in bench_link_params.
-- 2. Run in the Supabase SQL editor or psql.
-- 3. Capture the EXPLAIN ANALYZE output for the issue thread or a follow-up doc.

CREATE TEMP TABLE bench_link_params (
  user_id uuid NOT NULL,
  space_id uuid,
  clean_url text NOT NULL,
  raw_url text NOT NULL,
  search_term text NOT NULL
);

INSERT INTO bench_link_params (
  user_id,
  space_id,
  clean_url,
  raw_url,
  search_term
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'https://example.com/article',
  'https://example.com/article?utm_source=bench',
  'design system'
);

-- Baseline row counts for the chosen user.
SELECT
  p.user_id,
  COUNT(*) AS total_links,
  COUNT(*) FILTER (WHERE is_deleted = false AND is_archived = false) AS active_links,
  COUNT(*) FILTER (WHERE is_deleted = true) AS trashed_links,
  COUNT(*) FILTER (WHERE is_deleted = false AND is_archived = true) AS archived_links
FROM links l
CROSS JOIN bench_link_params p
WHERE l.user_id = p.user_id
GROUP BY p.user_id;

-- 1. Active list, first page.
EXPLAIN (ANALYZE, BUFFERS)
SELECT l.*
FROM links l
CROSS JOIN bench_link_params p
WHERE l.user_id = p.user_id
  AND l.is_deleted = false
  AND l.is_archived = false
ORDER BY l.is_pinned DESC, l.created_at DESC
LIMIT 100 OFFSET 0;

-- 2. Active list, deeper page to expose offset cost.
EXPLAIN (ANALYZE, BUFFERS)
SELECT l.*
FROM links l
CROSS JOIN bench_link_params p
WHERE l.user_id = p.user_id
  AND l.is_deleted = false
  AND l.is_archived = false
ORDER BY l.is_pinned DESC, l.created_at DESC
LIMIT 100 OFFSET 900;

-- 3. Exact count cost proxy for list reads.
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*)
FROM links l
CROSS JOIN bench_link_params p
WHERE l.user_id = p.user_id
  AND l.is_deleted = false
  AND l.is_archived = false;

-- 4. Trash list.
EXPLAIN (ANALYZE, BUFFERS)
SELECT l.*
FROM links l
CROSS JOIN bench_link_params p
WHERE l.user_id = p.user_id
  AND l.is_deleted = true
ORDER BY l.is_pinned DESC, l.created_at DESC
LIMIT 100 OFFSET 0;

-- 5. Space-filtered list via junction join.
EXPLAIN (ANALYZE, BUFFERS)
SELECT l.*
FROM links l
JOIN link_spaces ls
  ON ls.link_id = l.id
CROSS JOIN bench_link_params p
WHERE l.user_id = p.user_id
  AND ls.space_id = p.space_id
  AND l.is_deleted = false
  AND l.is_archived = false
ORDER BY l.is_pinned DESC, l.created_at DESC
LIMIT 100 OFFSET 0;

-- 6. Duplicate detection, indexed clean_url path.
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  id,
  url,
  clean_url,
  title,
  domain,
  content_type,
  color_value,
  favicon_url,
  is_pinned,
  is_deleted,
  is_archived,
  deleted_at,
  created_at,
  updated_at,
  description
FROM links l
CROSS JOIN bench_link_params p
WHERE l.user_id = p.user_id
  AND l.clean_url = p.clean_url
LIMIT 1;

-- 7. Duplicate detection, raw URL fallback path.
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  id,
  url,
  clean_url,
  title,
  domain,
  content_type,
  color_value,
  favicon_url,
  is_pinned,
  is_deleted,
  is_archived,
  deleted_at,
  created_at,
  updated_at,
  description
FROM links l
CROSS JOIN bench_link_params p
WHERE l.user_id = p.user_id
  AND l.url = p.raw_url
LIMIT 1;

-- 8. Search-heavy server read.
EXPLAIN (ANALYZE, BUFFERS)
SELECT l.*
FROM links l
CROSS JOIN bench_link_params p
WHERE l.user_id = p.user_id
  AND l.is_deleted = false
  AND l.is_archived = false
  AND (
    l.title ILIKE '%' || p.search_term || '%' OR
    l.url ILIKE '%' || p.search_term || '%' OR
    l.domain ILIKE '%' || p.search_term || '%' OR
    l.description ILIKE '%' || p.search_term || '%' OR
    l.site_name ILIKE '%' || p.search_term || '%'
  )
ORDER BY l.is_pinned DESC, l.created_at DESC
LIMIT 100 OFFSET 0;
