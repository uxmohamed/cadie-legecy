# Bookmark Import V0 Rollout Checklist

Use this checklist before enabling bookmark import in production.

## 1) Database and storage

1. Run Supabase migration `supabase/migrations/20260217_add_bookmark_import_jobs.sql`.
2. Confirm table exists: `public.bookmark_import_jobs`.
3. Confirm private storage bucket exists: `imports`.
4. Confirm storage RLS allows only `imports/{user_id}/...` paths.

## 2) Required environment variables

Set these in production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `CRON_SECRET`

If QStash vars are missing, `POST /api/imports/[id]/start` returns `503` and import is blocked.

## 3) Queue routing

1. Ensure the app can receive signed calls to:
   - `POST /api/jobs/process-bookmark-import`
   - `POST /api/jobs/enrich-metadata`
   - `POST /api/jobs/enrich-ai-tags`
2. Ensure QStash requests include `upstash-signature` and pass verification.

## 4) Scheduled cleanup

Run daily cron jobs with `Authorization: Bearer $CRON_SECRET`:

- `GET /api/cron/cleanup-trash`
- `GET /api/cron/cleanup-imports`

`cleanup-imports` expires drafts older than 24h and deletes stale import files from storage.

## 5) Smoke test (post deploy)

1. Open Settings -> Import.
2. Upload a browser bookmark HTML file.
3. Verify preview returns totals, invalid count, sample links, top-level folders.
4. Start import in each mode:
   - `single_space`
   - `manual_map`
   - `auto_create_spaces`
5. Verify progress transitions: `draft -> queued -> processing -> completed`.
6. Confirm duplicates are not recreated, trashed links are restored.
7. Confirm metadata + AI jobs are queued asynchronously.

## 6) Observability

Monitor for these failures during first rollout:

- `Failed to upload bookmark file`
- `Background import queue is unavailable`
- `Failed to download import file`
- `Failed to create links during import`
- `Failed to attach imported links to spaces`

Rollback strategy: hide Settings Import UI and disable start endpoint via env gate if needed.
