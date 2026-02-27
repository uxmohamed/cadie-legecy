import type { QueryClient } from "@tanstack/react-query";
import { del } from "idb-keyval";
import { CACHE_KEY, QUERY_CACHE_STORE } from "./persister";

/**
 * Clear all cached data when user logs out or switches accounts.
 * This prevents data leakage between users.
 * 
 * Clears:
 * - TanStack Query in-memory cache
 * - IndexedDB persisted cache
 */
export async function clearAllCaches(queryClient: QueryClient): Promise<void> {
  // Clear TanStack Query in-memory cache
  queryClient.clear();
  
  // Clear IndexedDB persisted cache (use same versioned key as persister)
  try {
    await del(CACHE_KEY, QUERY_CACHE_STORE);
  } catch (error) {
    // IndexedDB might not be available in all environments
    console.warn("Failed to clear IndexedDB cache:", error);
  }
}

/**
 * Hook-friendly version that can be used in components
 */
export function useClearCaches() {
  return { clearAllCaches };
}
