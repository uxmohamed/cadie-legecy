"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { makeQueryClient } from "./get-query-client";
import { createIDBPersister } from "./persister";

/**
 * QueryProvider with IndexedDB persistence
 * 
 * - Only enables persistence in browser (not SSR)
 * - Uses versioned cache key for easy invalidation
 * - Dehydrates/rehydrates query cache on page load
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient once, stable across re-renders
  const [queryClient] = React.useState(() => makeQueryClient());

  // Only create persister in browser environment
  const [persister] = React.useState(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    return createIDBPersister();
  });

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
      client={queryClient}
      persistOptions={{
        persister,
        // Max age of persisted data (24 hours)
        maxAge: 24 * 60 * 60 * 1000,
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
