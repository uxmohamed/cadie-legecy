# Robust Metadata Extraction Fix

## Goal Description

Fix metadata extraction (Title, Description, OG Image) failures in both Development and Production environments. The root cause was identified as fragile internal API calls failing due to network/DNS issues (loopback requests) and environment configuration mismatches (Production URL in local env).
The fix involves moving metadata extraction and database updates **in-process**, eliminating the need for internal API network calls.
Additionally, ensure single link creation (e.g. Chrome Extension) works identically to batch processing.

## User Review Required

> [!IMPORTANT]
>
> - Unifying `createLink` to use `metadataService.enrichLink` (10s timeout) instead of legacy `fetchMetadata` (5s timeout).
> - This increases reliability for single link additions but may extend response time to 10s for slow sites.

## Proposed Changes

### Service Layer

#### [Link Service] [link.service.ts](file:///Users/hassan/Repos/caddy/src/features/links/services/link.service.ts)

- [MODIFY] `createLink`: Replace `enrichLinkWithMetadata` (5s timeout) with `metadataService.enrichLink` (robust in-process updaters).
- [MODIFY] Re-fetch the link from repository after enrichment to return the full object.
- [DELETE] `enrichLinkWithMetadata` private method (now unused).

### Backend Logic

#### [Batch API] [route.ts](file:///Users/hassan/Repos/caddy/src/app/api/links/batch/route.ts)

- [COMPLETED] Increased synchronous processing limit to **50** links.

## Verification Plan

### Manual Verification

1. **Extension**: Add a link via Chrome Extension -> Verify instant metadata.
2. **Web App**: Add link via "Add Link" button -> Verify instant metadata.
3. **Slow Site**: Ensure slow sites (6-9s) still succeed (due to 10s timeout being respected).

### Automated Tests

- None required for this hotfix.
