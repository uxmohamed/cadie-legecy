import type { Link } from '@/features/links/types';

// =============================================================================
// Link Factory
// =============================================================================

let linkIdCounter = 1;

/**
 * Creates a mock Link object with sensible defaults
 * Override any properties by passing them in the partial
 */
export function createMockLink(overrides: Partial<Link> = {}): Link {
  const id = `link-${linkIdCounter++}`;
  const url = overrides.url || `https://example-${id}.com`;
  
  // Handle color values which are not valid URLs
  let domain = 'color';
  try {
    domain = new URL(url).hostname;
  } catch {
    // Not a valid URL (e.g., color hex like #FF5733)
    domain = overrides.domain || 'color';
  }
  
  return {
    id,
    user_id: 'test-user-id',
    url,
    clean_url: url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    title: overrides.title || `Example Link ${id}`,
    domain,
    content_type: 'url',
    category_id: null,
    color_value: null,
    favicon_url: null,
    og_image_url: null,
    description: null,
    ai_summary: null,
    ai_tags: null,
    ai_key_themes: null,
    ai_quotes: null,
    ai_facts: null,
    ai_people: null,
    is_pinned: false,
    is_archived: false,
    is_deleted: false,
    deleted_at: null,
    is_favorite: false,
    read_at: null,
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    final_url: null,
    canonical_url: null,
    site_name: null,
    favicon_variants: null,
    preview_image_width: null,
    preview_image_height: null,
    theme_color: null,
    language: null,
    word_count: null,
    reading_time_minutes: null,
    status_code: 200,
    fetch_status: 'success',
    fetched_at: new Date().toISOString(),
    etag: null,
    last_modified: null,
    ...overrides,
  };
}

/**
 * Creates a mock color Link
 */
export function createMockColorLink(color: string, overrides: Partial<Link> = {}): Link {
  return createMockLink({
    content_type: 'color',
    url: color,
    title: color,
    color_value: color,
    domain: 'color',
    ...overrides,
  });
}

/**
 * Creates multiple mock links
 */
export function createMockLinks(count: number, overrides: Partial<Link> = {}): Link[] {
  return Array.from({ length: count }, () => createMockLink(overrides));
}

/**
 * Creates a deleted (trashed) link
 */
export function createMockDeletedLink(overrides: Partial<Link> = {}): Link {
  return createMockLink({
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    ...overrides,
  });
}

/**
 * Creates a pinned link
 */
export function createMockPinnedLink(overrides: Partial<Link> = {}): Link {
  return createMockLink({
    is_pinned: true,
    ...overrides,
  });
}

/**
 * Reset the link ID counter (call in beforeEach for consistent IDs)
 */
export function resetLinkIdCounter(): void {
  linkIdCounter = 1;
}

// =============================================================================
// API Response Factories
// =============================================================================

export function createLinksApiResponse(links: Link[], total?: number) {
  return {
    links,
    total: total ?? links.length,
  };
}

export function createBatchApiResponse(links: Link[], count?: number, restored?: number) {
  return {
    links,
    count: count ?? links.length,
    restored: restored ?? 0,
  };
}

export function createErrorResponse(error: string, status = 400) {
  return {
    error,
    status,
  };
}
