# Robust Metadata Extraction Fix

## Goal Description

Fix metadata extraction (Title, Description, OG Image) failures in both Development and Production environments. The root cause was identified as fragile internal API calls failing due to network/DNS issues (loopback requests) and environment configuration mismatches (Production URL in local env).
The fix involves moving metadata extraction and database updates **in-process**, eliminating the need for internal API network calls.
Additionally, ensure batch processing provides a "dev-like" instant experience by running synchronously for batches up to 50 links.

## User Review Required

> [!IMPORTANT]
> increasing synchronous limit to 50 links. This is a tradeoff: It ensures reliability for manual usage (up to 50 links) but might hit execution time limits if links are very slow to respond. However, since metadata extraction runs in parallel, this is generally safe.

## Proposed Changes

### Backend Logic

#### [Batch API] [route.ts](file:///Users/hassan/Repos/caddy/src/app/api/links/batch/route.ts)

- [MODIFY] Increase synchronous processing limit from 20 to **50** links to cover the "25 links" use case.

## Verification Plan

### Manual Verification

1. **Single Link Add**: Add a link -> Verify instant metadata.
2. **Medium Batch Add**: Add 25 links -> Verify all appear instantly with metadata (Synchronous path).
3. **Large Batch Add**: Add 55 links -> Verify they are queued (QStash) and process successfully in background (Async path).

### Automated Tests

- None required for this hotfix.
