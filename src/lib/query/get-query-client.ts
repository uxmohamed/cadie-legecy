import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

/**
 * Default options for the QueryClient
 * staleTime prevents immediate refetch after hydration
 */
const queryClientOptions = {
  defaultOptions: {
    queries: {
      // 5 minutes - allow realtime to handle updates
      staleTime: 5 * 60 * 1000,
      // 2 hours - keep data in cache (reduced from 24 to prevent stale data issues)
      gcTime: 2 * 60 * 60 * 1000,
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
