import { createStore, set, get, del } from "idb-keyval";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

const QUERY_CACHE_PREFIX = "tanstack-query-cache";
const ANONYMOUS_CACHE_SCOPE = "anonymous";

// VERSIONED KEY - bump when schema changes to invalidate old cache.
// v3: Scope persisted caches per user to prevent cross-account hydration.
export const QUERY_CACHE_SCHEMA_VERSION = "v3";
export const QUERY_CACHE_STORE = createStore("caddy-cache", "query-cache");

function normalizeCacheScope(userId?: string | null): string {
  const normalizedUserId = userId?.trim();
  return normalizedUserId && normalizedUserId.length > 0
    ? normalizedUserId
    : ANONYMOUS_CACHE_SCOPE;
}

export function getQueryCacheKey(
  userId?: string | null,
  schemaVersion: string = QUERY_CACHE_SCHEMA_VERSION
): string {
  return `${QUERY_CACHE_PREFIX}:${schemaVersion}:user:${normalizeCacheScope(userId)}`;
}

export async function removePersistedClient(userId?: string | null): Promise<void> {
  await del(getQueryCacheKey(userId), QUERY_CACHE_STORE);
}

/**
 * Creates an IndexedDB persister for TanStack Query
 * Uses idb-keyval for simple key-value storage
 */
export function createIDBPersister(options: { userId?: string | null } = {}): Persister {
  const cacheKey = getQueryCacheKey(options.userId);

  return {
    persistClient: async (client: PersistedClient) => {
      await set(cacheKey, client, QUERY_CACHE_STORE);
    },
    restoreClient: async () => {
      return await get<PersistedClient>(cacheKey, QUERY_CACHE_STORE);
    },
    removeClient: async () => {
      await del(cacheKey, QUERY_CACHE_STORE);
    },
  };
}
