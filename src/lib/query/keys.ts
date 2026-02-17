import type { LinkFilters } from "@/features/links/types";

/**
 * Helper to create stable serialized filter key
 * Prevents cache misses from new object references on re-render
 */
function stableFilters(filters: LinkFilters): string {
  // Sort keys for consistent serialization
  const sortedKeys = Object.keys(filters).sort() as (keyof LinkFilters)[];
  const sortedObj: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    if (filters[key] !== undefined) {
      sortedObj[key] = filters[key];
    }
  }
  return JSON.stringify(sortedObj);
}

/**
 * Centralized query key factory
 * 
 * Benefits:
 * - Type-safe cache invalidation
 * - Stable filter serialization (prevents cache misses)
 * - Hierarchical keys for partial invalidation
 * 
 * Usage:
 * - queryKeys.links.all - invalidate all link queries
 * - queryKeys.links.list(filters) - specific filtered list
 * - queryKeys.links.detail(id) - single link
 */
export const queryKeys = {
  links: {
    // Base key for all link queries
    all: ["links"] as const,
    // List with serialized filters (stable key)
    list: (filters: LinkFilters) => ["links", "list", stableFilters(filters)] as const,
    // Single link detail
    detail: (id: string) => ["links", "detail", id] as const,
  },
  spaces: {
    // Base key for all space queries
    all: ["spaces"] as const,
    // List of all spaces
    list: () => ["spaces", "list"] as const,
    // Single space detail
    detail: (id: string) => ["spaces", "detail", id] as const,
    // Links within a specific space (convenience alias)
    links: (spaceId: string) => ["spaces", spaceId, "links"] as const,
  },
  // Link-space relationships
  linkSpaces: {
    all: ["linkSpaces"] as const,
    byLink: (linkId: string) => ["linkSpaces", "link", linkId] as const,
    bySpace: (spaceId: string) => ["linkSpaces", "space", spaceId] as const,
  },
  imports: {
    all: ["imports"] as const,
    list: (limit: number = 20) => ["imports", "list", limit] as const,
    detail: (id: string) => ["imports", "detail", id] as const,
  },
} as const;

/**
 * Type helpers for query keys
 */
export type QueryKeys = typeof queryKeys;
export type LinkQueryKey = ReturnType<typeof queryKeys.links.list>;
export type SpaceQueryKey = ReturnType<typeof queryKeys.spaces.list>;
