import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

/**
 * Default options for the QueryClient
 * staleTime prevents immediate refetch after hydration
 */
const queryClientOptions = {
  defaultOptions: {
    queries: {
      // 1 minute - prevents immediate refetch on hydration
      staleTime: 60 * 1000,
      // 24 hours - keep data in cache for persistence
      gcTime: 24 * 60 * 60 * 1000,
      // Don't refetch on window focus by default (realtime handles updates)
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
    },
  },
};

/**
 * Creates a QueryClient for server-side usage
 * Uses React cache() to ensure same client per RSC render
 */
export const getQueryClient = cache(() => new QueryClient(queryClientOptions));

/**
 * Creates a QueryClient for client-side usage
 * Should be called once and stored in a ref/state
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient(queryClientOptions);
}
