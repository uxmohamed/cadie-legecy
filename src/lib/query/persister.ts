import { createStore, set, get, del } from "idb-keyval";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

// VERSIONED KEY - bump when schema changes to invalidate old cache
// v2: Reduced staleTime from 0 to 5min, gcTime from 24hr to 2hr, maxAge from 24hr to 1hr
export const CACHE_KEY = "tanstack-query-cache-v2";
export const QUERY_CACHE_STORE = createStore("caddy-cache", "query-cache");

/**
 * Creates an IndexedDB persister for TanStack Query
 * Uses idb-keyval for simple key-value storage
 */
export function createIDBPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(CACHE_KEY, client, QUERY_CACHE_STORE);
    },
    restoreClient: async () => {
      return await get<PersistedClient>(CACHE_KEY, QUERY_CACHE_STORE);
    },
    removeClient: async () => {
      await del(CACHE_KEY, QUERY_CACHE_STORE);
    },
  };
}
