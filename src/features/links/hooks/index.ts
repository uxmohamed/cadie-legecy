/**
 * Barrel export for link hooks
 */
export { useRealtimeSync } from "./use-realtime-sync.hook";
export { useSearchLinks } from "./use-search-links";

// TanStack Query hooks are the primary interface
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