import { createStore, set, get, del } from "idb-keyval";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

// VERSIONED KEY - bump when schema changes to invalidate old cache
export const CACHE_KEY = "tanstack-query-cache-v1";
const store = createStore("caddy-cache", "query-cache");

/**
 * Creates an IndexedDB persister for TanStack Query
 * Uses idb-keyval for simple key-value storage
 */
export function createIDBPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(CACHE_KEY, client, store);
    },
    restoreClient: async () => {
      return await get<PersistedClient>(CACHE_KEY, store);
    },
    removeClient: async () => {
      await del(CACHE_KEY, store);
    },
  };
}
