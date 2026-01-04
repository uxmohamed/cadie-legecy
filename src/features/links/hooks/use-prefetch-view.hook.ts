"use client";

import * as React from "react";
import { preload } from "swr";

/**
 * Page size must match use-links.hook.ts
 */
const PAGE_SIZE = 100;

/**
 * Delay before prefetching to avoid competing with initial render
 */
const PREFETCH_DELAY_MS = 3000;

/**
 * Build the SWR cache key for a given view
 * Must match the pattern in use-links.hook.ts buildQueryString
 */
function buildCacheKey(isDeleted: boolean, userId: string): string {
  const params = new URLSearchParams();
  params.append("is_deleted", String(isDeleted));
  params.append("limit", String(PAGE_SIZE));
  params.append("offset", "0");
  return `/api/links?${params.toString()}#user=${userId}`;
}

/**
 * Fetcher function (same as use-links.hook.ts)
 */
async function fetcher<T>(url: string): Promise<T> {
  const fetchUrl = url.split('#')[0];
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error("Failed to prefetch");
  }
  return response.json();
}

/**
 * Hook to prefetch the opposite view's data after initial render
 * 
 * - Waits 3 seconds after mount to avoid blocking initial load
 * - Uses requestIdleCallback for lowest priority
 * - Only prefetches once per mount
 * - Populates SWR cache so view switches are instant
 */
export function usePrefetchView(
  currentView: "all" | "trash",
  userId: string | undefined,
  isAuthenticated: boolean
): void {
  const hasPrefetched = React.useRef(false);

  React.useEffect(() => {
    // Skip if already prefetched, not authenticated, or no userId
    if (hasPrefetched.current || !isAuthenticated || !userId) {
      return;
    }

    // Determine which view to prefetch (opposite of current)
    const prefetchDeleted = currentView === "all";
    const cacheKey = buildCacheKey(prefetchDeleted, userId);

    // Schedule prefetch after delay
    const timeoutId = setTimeout(() => {
      // Use requestIdleCallback if available for lowest priority
      const runPrefetch = () => {
        hasPrefetched.current = true;

        // Use SWR's preload API to populate cache
        // This ensures the data is available when useSWRInfinite runs
        preload(cacheKey, fetcher).catch(() => {
          // Silently fail - prefetch is best-effort
          // User will just see loading state if they switch views
        });
      };

      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(runPrefetch, { timeout: 5000 });
      } else {
        runPrefetch();
      }
    }, PREFETCH_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentView, userId, isAuthenticated]);
}
