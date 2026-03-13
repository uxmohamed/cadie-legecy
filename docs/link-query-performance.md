# Link Query Performance Strategy

Updated: 2026-03-13

This document formalizes the current hot-path query strategy for the `GET /api/links` family and the duplicate-detection reads that happen on `POST /api/links`.

## Scope

Covered paths:

- `GET /api/links` via [`src/app/api/links/route.ts`](../src/app/api/links/route.ts)
- Query parsing in [`src/features/links/api/handlers/get-links.handler.ts`](../src/features/links/api/handlers/get-links.handler.ts)
- Repository reads in [`src/features/links/repositories/supabase-link.repository.ts`](../src/features/links/repositories/supabase-link.repository.ts)
- Existing indexes in [`supabase/migrations/20260213_add_performance_indexes.sql`](../supabase/migrations/20260213_add_performance_indexes.sql)

Not covered:

- Metadata enrichment jobs
- Export queries
- Future dedicated search services

## Current Consumer Map

The current codebase uses the route family in two distinct ways:

1. Main dashboard list reads use [`useLinksQuery`](../src/features/links/queries/use-links-query.ts), which pages through the full filtered dataset in chunks of 100 and intentionally does not send `q` to the server. Search text is applied client-side via Fuse in [`useSearchLinks`](../src/features/links/hooks/use-search-links.ts).
2. Server-side search only exists on the paginated/infinite-query path in [`useLinksInfiniteQuery`](../src/features/links/queries/use-links-query.ts), which forwards `q` to `GET /api/links`.

That means the current hottest route is not "search while typing". It is repeated active-list hydration:

- all links
- space-filtered links
- trash links
- exact duplicate detection on save

## Existing Indexes

The current migration adds four relevant indexes plus an API-token lookup index:

| Index | Definition | Current role |
| --- | --- | --- |
| `idx_links_user_active` | `(user_id, is_deleted, is_archived, created_at DESC)` | Narrows the most common active/trash list filters and supports recent-first scans. |
| `idx_links_user_clean_url` | `(user_id, clean_url) WHERE is_deleted = false` | Primary duplicate-detection path for active links. |
| `idx_links_user_pinned` | `(user_id, is_pinned DESC, created_at DESC) WHERE is_deleted = false` | Helps pinned-first ordering for active non-deleted lists. |
| `idx_link_spaces_space` | `(space_id, link_id)` | Supports the junction-table side of space-filtered reads. |

## Query Shapes

### 1. Active list

Source:

- [`src/features/links/api/handlers/get-links.handler.ts`](../src/features/links/api/handlers/get-links.handler.ts)
- [`src/features/links/repositories/supabase-link.repository.ts`](../src/features/links/repositories/supabase-link.repository.ts)

Shape:

```sql
SELECT *
FROM links
WHERE user_id = $1
  AND is_deleted = false
  AND is_archived = false
ORDER BY is_pinned DESC, created_at DESC
LIMIT $2 OFFSET $3;
```

Coverage today:

- `idx_links_user_active` aligns with the filter prefix and `created_at DESC`.
- `idx_links_user_pinned` helps pinned-first ordering for non-deleted rows, but it does not encode `is_archived`, so PostgreSQL may still need extra work depending on row counts and selectivity.
- Exact counts are requested on list reads, so count cost must be measured separately from page fetch cost.

### 2. Trash list

Shape:

```sql
SELECT *
FROM links
WHERE user_id = $1
  AND is_deleted = true
ORDER BY is_pinned DESC, created_at DESC
LIMIT $2 OFFSET $3;
```

Coverage today:

- `idx_links_user_active` still helps with the `user_id + is_deleted` filter, but trash needs its own measurement because deleted rows can age into a different distribution than active rows.

### 3. Space-filtered list

Shape:

```sql
SELECT l.*
FROM links l
JOIN link_spaces ls
  ON ls.link_id = l.id
WHERE l.user_id = $1
  AND ls.space_id = $2
  AND l.is_deleted = false
  AND l.is_archived = false
ORDER BY l.is_pinned DESC, l.created_at DESC
LIMIT $3 OFFSET $4;
```

Coverage today:

- `idx_link_spaces_space` covers the junction lookup.
- The link-side filters still rely on the existing `links` indexes.

Note:

- The repository already uses the join-based pattern above.
- [`prefetchSpaceLinks`](../src/lib/server/prefetch-links.ts) is an older outlier that still does "fetch `link_id`s, then `IN (...)`". If that helper becomes hot, it should be brought into alignment with the join strategy instead of adding indexes around the older pattern.

### 4. Search-heavy server read

Shape:

```sql
SELECT *
FROM links
WHERE user_id = $1
  AND is_deleted = false
  AND is_archived = false
  AND (
    title ILIKE $2 OR
    url ILIKE $2 OR
    domain ILIKE $2 OR
    description ILIKE $2 OR
    site_name ILIKE $2
  )
ORDER BY is_pinned DESC, created_at DESC
LIMIT $3 OFFSET $4;
```

Coverage today:

- Filter narrowing still benefits from the existing B-tree indexes.
- There is no dedicated text-search index for the `ILIKE` predicate.
- Server-side `q` also searches fewer fields than client-side Fuse. It does not currently include `notes`, `content_text`, `ai_summary`, `ai_tags`, or `spaces`.

Implication:

- This query family is the first place where plain indexed reads are likely to stop scaling cleanly.
- It should be measured before adding any speculative text index.

### 5. Duplicate detection on save

Source:

- [`findByUrl()` in `supabase-link.repository.ts`](../src/features/links/repositories/supabase-link.repository.ts)

Primary shape:

```sql
SELECT id, url, clean_url, title, domain, content_type, color_value,
       favicon_url, is_pinned, is_deleted, is_archived, deleted_at,
       created_at, updated_at, description
FROM links
WHERE user_id = $1
  AND clean_url = $2
LIMIT 1;
```

Fallback shape:

```sql
SELECT id, url, clean_url, title, domain, content_type, color_value,
       favicon_url, is_pinned, is_deleted, is_archived, deleted_at,
       created_at, updated_at, description
FROM links
WHERE user_id = $1
  AND url = $2
LIMIT 1;
```

Coverage today:

- `idx_links_user_clean_url` is the main hot-path duplicate index.
- The raw `url` fallback has no dedicated index and should only stay as a rare compatibility path.

## Measurement Summary From Code Inspection

Current code inspection gives us three concrete conclusions even before live `EXPLAIN` runs:

1. The dominant read path today is full-list hydration, not server-side search, because the main dashboard applies search locally with Fuse after fetching all filtered pages.
2. Exact counts are requested on list reads, so any benchmark should measure both page fetch cost and count cost. The count can become the dominant part of the request before the page read itself does.
3. The existing join-based space query is the preferred pattern. The older "IDs first, then `IN (...)`" prefetch helper should not become the basis for new index work.

## Chosen Near-Term Search Strategy

Near-term decision:

- Keep list reads and duplicate detection on indexed Postgres.
- Keep the main dashboard search client-side for the current UX, since it already has richer ranking and broader field coverage than the server-side `ILIKE` path.
- Treat server-side `q` as a secondary path that needs explicit measurement before we optimize it.
- If server-side search becomes necessary at larger per-user link counts, stay inside Postgres first. The next step should be a dedicated Postgres search path such as `pg_trgm` or a generated search document, not an external search service.

This keeps the current architecture simple while making the next scaling step explicit.

## Benchmark Plan

Use [`supabase/benchmarks/links-hot-path.sql`](../supabase/benchmarks/links-hot-path.sql) against realistic data volume and record:

- page 1 active list latency
- deep-page active list latency
- exact count latency
- space-filtered list latency
- duplicate-detection latency
- search-heavy latency

Recommended data tiers:

- at least one user with `10k+` links
- at least one user with `50k+` links
- if possible, a synthetic `100k+` or `250k+` user to expose the next scaling cliff

## Follow-Up Triggers

Open follow-up work only if measurement shows pain:

- Add a dedicated server-side search index if `ILIKE` dominates latency.
- Revisit count strategy if `count=exact` becomes a significant share of request time.
- Align older prefetch helpers with the repository join strategy if those helpers become active again.
- Add a composite index that better matches `is_pinned DESC, created_at DESC` only if the current sort cannot stay within acceptable latency on realistic data.

Until those measurements exist, do not add more link indexes by default.
