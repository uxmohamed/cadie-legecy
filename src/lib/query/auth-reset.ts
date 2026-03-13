import type { QueryClient } from "@tanstack/react-query";
import { removePersistedClient } from "./persister";

/**
 * Clear all cached data when user logs out or switches accounts.
 * This prevents data leakage between users.
 * 
 * Clears:
 * - TanStack Query in-memory cache
 * - IndexedDB persisted cache for the active user scope
 */
export async function clearAllCaches(
  queryClient: QueryClient,
  userId?: string | null
): Promise<void> {
  // Clear TanStack Query in-memory cache
  queryClient.clear();

  // Clear IndexedDB persisted cache for the current user scope
  try {
    await removePersistedClient(userId);
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
