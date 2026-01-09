/**
 * Barrel export for link hooks
 */
export { useRealtimeSync } from "./use-realtime-sync.hook";

// TanStack Query hooks are the primary interface now
// Re-export from queries for convenience
export {
  useLinksQuery,
  useLinksInfiniteQuery,
  useLinkQuery,
} from "../queries/use-links-query";

export {
  useLinkMutations,
  useCopyUrl,
} from "../queries/use-link-mutations";

// Legacy hook - deprecated, will be removed
// Only kept for backwards compatibility during migration
export { useLinks } from "./use-links.hook";