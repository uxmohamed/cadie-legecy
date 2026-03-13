import type { ExtractedMetadata, FaviconVariant } from "@/features/links/types/link.types";

/**
 * Async enrichment ownership rules for links.
 *
 * Metadata fields are split into two lanes:
 * - Recovery lane: extension recovery is a backfill-only writer. It may resolve
 *   `fetch_status` and `fetched_at`, but it only fills empty or obviously
 *   generic values for `title`, `description`, `og_image_url`, `favicon_url`,
 *   `site_name`, `final_url`, `canonical_url`, `content_text`,
 *   `favicon_variants`, `preview_image_width`, `preview_image_height`,
 *   `theme_color`, `language`, `word_count`, `reading_time_minutes`,
 *   `status_code`, `etag`, and `last_modified`.
 * - Queue lane: the queued metadata worker is the authoritative metadata writer
 *   for the same metadata fields once it succeeds. It may replace recovery
 *   values with fuller metadata, but it must never downgrade an
 *   already-successful link back to a failure state.
 *
 * AI fields use a simpler rule:
 * - `ai_tags` and `ai_key_themes` are fill-once. Both the queued AI job and the
 *   recovery path must skip when tags already exist.
 */
export interface MetadataOwnershipSnapshot {
  url: string;
  title?: string | null;
  domain?: string | null;
  description?: string | null;
  og_image_url?: string | null;
  favicon_url?: string | null;
  site_name?: string | null;
  content_text?: string | null;
  final_url?: string | null;
  canonical_url?: string | null;
  favicon_variants?: FaviconVariant[] | null;
  preview_image_width?: number | null;
  preview_image_height?: number | null;
  theme_color?: string | null;
  language?: string | null;
  word_count?: number | null;
  reading_time_minutes?: number | null;
  status_code?: number | null;
  fetch_status?: string | null;
  fetched_at?: string | null;
  etag?: string | null;
  last_modified?: string | null;
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasArrayValues<T>(value: T[] | null | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

function hasGenericTitle(link: Pick<MetadataOwnershipSnapshot, "title" | "url" | "domain">): boolean {
  return !hasText(link.title) || link.title === link.url || (hasText(link.domain) && link.title === link.domain);
}

function assignIfPresent<T>(
  updates: Record<string, unknown>,
  key: string,
  value: T | null | undefined,
  predicate: (candidate: T | null | undefined) => boolean = (candidate) => candidate !== null && candidate !== undefined
): void {
  if (predicate(value)) {
    updates[key] = value;
  }
}

export function shouldSkipAITagWrite(existingTags: string[] | null | undefined): boolean {
  return hasArrayValues(existingTags);
}

export function shouldPreserveResolvedMetadata(link: Pick<MetadataOwnershipSnapshot, "fetch_status">): boolean {
  return link.fetch_status === "success";
}

export function buildRecoveryMetadataUpdates(
  link: MetadataOwnershipSnapshot,
  metadata: ExtractedMetadata
): Record<string, unknown> {
  const updates: Record<string, unknown> = {
    fetch_status: metadata.fetch_status,
    fetched_at: metadata.fetched_at,
  };

  if (hasGenericTitle(link) && hasText(metadata.title) && metadata.title !== metadata.domain) {
    updates.title = metadata.title;
  }
  if (!hasText(link.description) && hasText(metadata.description)) {
    updates.description = metadata.description;
  }
  if (!hasText(link.og_image_url) && hasText(metadata.preview_image_url)) {
    updates.og_image_url = metadata.preview_image_url;
  }
  if (!hasText(link.favicon_url) && hasText(metadata.favicon_url)) {
    updates.favicon_url = metadata.favicon_url;
  }
  if (!hasText(link.site_name) && hasText(metadata.site_name)) {
    updates.site_name = metadata.site_name;
  }
  if (!hasText(link.final_url) && hasText(metadata.final_url)) {
    updates.final_url = metadata.final_url;
  }
  if (!hasText(link.canonical_url) && hasText(metadata.canonical_url)) {
    updates.canonical_url = metadata.canonical_url;
  }
  if (!hasText(link.content_text) && hasText(metadata.content_text)) {
    updates.content_text = metadata.content_text;
  }
  if (!hasArrayValues(link.favicon_variants) && hasArrayValues(metadata.favicon_variants)) {
    updates.favicon_variants = metadata.favicon_variants;
  }
  if (link.preview_image_width == null && metadata.preview_image_width != null) {
    updates.preview_image_width = metadata.preview_image_width;
  }
  if (link.preview_image_height == null && metadata.preview_image_height != null) {
    updates.preview_image_height = metadata.preview_image_height;
  }
  if (!hasText(link.theme_color) && hasText(metadata.theme_color)) {
    updates.theme_color = metadata.theme_color;
  }
  if (!hasText(link.language) && hasText(metadata.language)) {
    updates.language = metadata.language;
  }
  if (link.word_count == null && metadata.word_count != null) {
    updates.word_count = metadata.word_count;
  }
  if (link.reading_time_minutes == null && metadata.reading_time_minutes != null) {
    updates.reading_time_minutes = metadata.reading_time_minutes;
  }
  if (link.status_code == null && metadata.status_code != null) {
    updates.status_code = metadata.status_code;
  }
  if (!hasText(link.etag) && hasText(metadata.etag)) {
    updates.etag = metadata.etag;
  }
  if (!hasText(link.last_modified) && hasText(metadata.last_modified)) {
    updates.last_modified = metadata.last_modified;
  }

  return updates;
}

export function buildQueuedMetadataSuccessUpdates(metadata: ExtractedMetadata): Record<string, unknown> {
  const updates: Record<string, unknown> = {
    title: metadata.title,
    fetch_status: "success",
    fetched_at: metadata.fetched_at,
  };

  assignIfPresent(updates, "description", metadata.description, hasText);
  assignIfPresent(updates, "og_image_url", metadata.preview_image_url, hasText);
  assignIfPresent(updates, "favicon_url", metadata.favicon_url, hasText);
  assignIfPresent(updates, "site_name", metadata.site_name, hasText);
  assignIfPresent(updates, "final_url", metadata.final_url, hasText);
  assignIfPresent(updates, "canonical_url", metadata.canonical_url, hasText);
  assignIfPresent(updates, "content_text", metadata.content_text, hasText);
  assignIfPresent(updates, "favicon_variants", metadata.favicon_variants, hasArrayValues);
  assignIfPresent(updates, "preview_image_width", metadata.preview_image_width);
  assignIfPresent(updates, "preview_image_height", metadata.preview_image_height);
  assignIfPresent(updates, "theme_color", metadata.theme_color, hasText);
  assignIfPresent(updates, "language", metadata.language, hasText);
  assignIfPresent(updates, "word_count", metadata.word_count);
  assignIfPresent(updates, "reading_time_minutes", metadata.reading_time_minutes);
  assignIfPresent(updates, "status_code", metadata.status_code);
  assignIfPresent(updates, "etag", metadata.etag, hasText);
  assignIfPresent(updates, "last_modified", metadata.last_modified, hasText);

  return updates;
}

export function buildQueuedMetadataFailureUpdates(
  link: Pick<MetadataOwnershipSnapshot, "fetch_status">,
  metadata: Pick<ExtractedMetadata, "fetch_status" | "fetched_at">
): Record<string, unknown> | null {
  if (shouldPreserveResolvedMetadata(link)) {
    return null;
  }

  return {
    fetch_status: metadata.fetch_status,
    fetched_at: metadata.fetched_at,
  };
}
