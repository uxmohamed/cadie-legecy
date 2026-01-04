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
 * Timeout for requestIdleCallback to ensure prefetch runs even during heavy load
 * Set to 5 seconds (2 seconds after PREFETCH_DELAY_MS) to guarantee execution
 * while still allowing the browser to find an idle period during light load
 */
const IDLE_CALLBACK_TIMEOUT_MS = 5000;

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
  const prefetchedViews = React.useRef<Set<"all" | "trash">>(new Set());

  React.useEffect(() => {
    // Determine which view to prefetch (opposite of current)
    const targetView: "all" | "trash" = currentView === "all" ? "trash" : "all";

    // Skip if this target view has already been prefetched, not authenticated, or no userId
    if (prefetchedViews.current.has(targetView) || !isAuthenticated || !userId) {
      return;
    }

    const prefetchDeleted = targetView === "trash";
    const cacheKey = buildCacheKey(prefetchDeleted, userId);

    // Schedule prefetch after delay
    const timeoutId = setTimeout(() => {
      // Use requestIdleCallback if available for lowest priority
      const runPrefetch = () => {
        prefetchedViews.current.add(targetView);

        // Use SWR's preload API to populate cache
        // This ensures the data is available when useSWRInfinite runs
        preload(cacheKey, fetcher).catch(() => {
          // Silently fail - prefetch is best-effort
          // User will just see loading state if they switch views
        });
      };

      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(runPrefetch, { timeout: IDLE_CALLBACK_TIMEOUT_MS });
      } else {
        runPrefetch();
      }
    }, PREFETCH_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentView, userId, isAuthenticated]);
}
