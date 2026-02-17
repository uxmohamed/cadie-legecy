# Link Export V0 Rollout Checklist

Use this checklist before enabling link export in production.

## 1) Endpoint and auth

1. Confirm endpoint exists: `GET /api/exports/links/csv`.
2. Confirm unauthenticated request returns `401`.
3. Confirm authenticated request returns `200` with CSV attachment headers.
4. Confirm export includes only active links (`is_deleted=false`, `is_archived=false`).

## 2) Rate limit behavior

1. Confirm limiter is active for exports.
2. Confirm limit-exceeded requests return `429`.
3. Confirm rate-limit headers are returned:
   - `X-RateLimit-Limit`
   - `X-RateLimit-Remaining`
   - `X-RateLimit-Reset`
   - `Retry-After`

## 3) CSV contract checks

1. Response headers:
   - `Content-Type: text/csv; charset=utf-8`
   - `Content-Disposition: attachment; filename="cadie-links-active-YYYYMMDD-HHmmss.csv"`
   - `Cache-Control: no-store`
2. Confirm first bytes include UTF-8 BOM.
3. Confirm columns include full `links` mirror plus:
   - `space_ids_json`
   - `space_names_json`
4. Confirm JSON columns are parseable arrays.

## 4) Smoke test (post deploy)

1. Open Settings -> Export.
2. Click **Export CSV**.
3. Verify file downloads successfully.
4. Open file in Excel/Numbers/Google Sheets.
5. Validate rows include mixed content types if present (`url`, `color`, `image`, `document`, `note`).
6. Validate `is_archived` and `is_deleted` columns are present and `false` for all rows.

## 5) Known failure modes

Monitor for these failures during rollout:

- `Unauthorized`
- `Too many requests. Please try again later.`
- `Failed to fetch links for export`
- `Failed to fetch space mappings for export`
- `Failed to fetch space names for export`

## 6) Rollback

If export causes incidents:

1. Hide Settings Export UI entry.
2. Return `404`/disable route behind an env gate.
3. Re-enable after fixes and smoke verification.
