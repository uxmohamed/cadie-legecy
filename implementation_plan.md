# Robust Metadata Extraction Fix

## Goal Description

Fix metadata extraction (Title, Description, OG Image) failures in both Development and Production environments. The root cause was identified as fragile internal API calls failing due to network/DNS issues (loopback requests) and environment configuration mismatches (Production URL in local env).
The fix involves moving metadata extraction and database updates **in-process**, eliminating the need for internal API network calls.
Additionally, ensure batch processing provides a "dev-like" instant experience by running synchronously for batches up to 20 links.

## User Review Required

> [!IMPORTANT]
> This change modifies the core `MetadataService` to interact directly with the database (Supabase) instead of calling API endpoints. This is more robust but tightly couples the service to the server environment (Node.js).

## Proposed Changes

### Backend Logic

#### [Batch API] [route.ts](file:///Users/hassan/Repos/caddy/src/app/api/links/batch/route.ts)

- [MODIFY] Increase synchronous processing limit from 5 to **20** links.
- [MODIFY] Ensure fresh data is fetched and returned for these links.

#### [Service Layer] [metadata.service.ts](file:///Users/hassan/Repos/caddy/src/features/links/services/metadata.service.ts)

- [MODIFY] `enrichLink`: Already updated to use direct DB update.
- [MODIFY] `enrichBatchLinks`: Refactor to use direct DB update (via `createClient`) instead of internal `PUT` API calls. This ensures large background batches also don't fail on network loopbacks.

## Verification Plan

### Manual Verification

1. **Single Link Add**: Add a link (e.g. `https://stripe.com`) -> Verify Title/Image appear instantly.
2. **Small Batch Add**: Add 5 links at once -> Verify all appear instantly with metadata.
3. **Medium Batch Add**: Add 15 links -> Verify all appear instantly with metadata (Synchronous path).
4. **Large Batch Add**: Add 25 links -> Verify they are queued (QStash) and process successfully in background (Async path).

### Automated Tests

- None required for this hotfix, manual verification is sufficient.
