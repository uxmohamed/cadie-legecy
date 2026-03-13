"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { makeQueryClient } from "./get-query-client";
import { createIDBPersister, getQueryCacheKey } from "./persister";

/**
 * QueryProvider with IndexedDB persistence
 *
 * - Only enables persistence in browser (not SSR)
 * - Uses a user-scoped, versioned cache key for easy invalidation
 * - Dehydrates/rehydrates query cache on page load
 * - Remounts when the authenticated user changes to avoid cross-account memory reuse
 */
export function QueryProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: string | null;
}) {
  const cacheScopeKey = React.useMemo(() => getQueryCacheKey(userId), [userId]);
  const [queryClient] = React.useState(() => makeQueryClient());

  const persister = React.useMemo(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    return createIDBPersister({ userId });
  }, [userId]);

  // If no persister (SSR), use regular QueryClientProvider
  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  // With persister, use PersistQueryClientProvider for IndexedDB caching
  return (
    <PersistQueryClientProvider
      key={cacheScopeKey}
      client={queryClient}
      persistOptions={{
        persister,
        // Max age of persisted data (1 hour - reduced from 24 to prevent stale data issues)
        maxAge: 1 * 60 * 60 * 1000,
        // Buster tracks the same scoped key so account changes cannot reuse another user's cache
        buster: cacheScopeKey,
        // Dehydrate options - what to persist
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Only persist successful queries
            return query.state.status === "success";
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
