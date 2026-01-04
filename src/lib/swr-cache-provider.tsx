"use client";

import * as React from "react";
import { SWRConfig, Cache } from "swr";

/**
 * Clear the SWR localStorage cache.
 * Call this when user logs out or switches accounts.
 */
export function clearSWRCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("swr-cache");
    localStorage.removeItem("swr-cache-user");
  } catch {
    // Ignore errors
  }
}

/**
 * Creates a localStorage-based cache provider for SWR.
 * This persists the SWR cache across page refreshes, making the app feel instant
 * on subsequent visits.
 * 
 * Cache is isolated per user - if userId in cache key changes, old cache is cleared.
 */
function localStorageProvider(cache: Readonly<Cache>): Cache {
  // Only run on client
  if (typeof window === "undefined") {
    return cache;
  }

  // Load from localStorage on init
  const map = new Map<string, { data: unknown; isLoading: boolean; isValidating: boolean; error?: unknown }>();
  
  // Get previously stored user ID to detect user changes
  const storedUserId = localStorage.getItem("swr-cache-user");
  
  try {
    const stored = localStorage.getItem("swr-cache");
    if (stored) {
      const parsed = JSON.parse(stored) as Array<[string, { data: unknown }]>;
      parsed.forEach(([key, value]) => {
        map.set(key, { data: value.data, isLoading: false, isValidating: false });
      });
    }
  } catch {
    // Ignore parse errors, start fresh
  }

  // Save to localStorage when page unloads
  const saveCache = () => {
    try {
      // Only cache /api/links responses and limit size
      const entries: Array<[string, { data: unknown }]> = Array.from(map.entries())
        .filter(([key]) => key.startsWith("/api/links"))
        .map(([key, value]) => [key, { data: value.data }]);
      localStorage.setItem("swr-cache", JSON.stringify(entries));
      
      // Also save the current user ID from any cached entry
      const userEntry = entries.find(([key]) => key.includes("#user="));
      if (userEntry) {
        const match = userEntry[0].match(/#user=([^&]+)/);
        if (match) {
          localStorage.setItem("swr-cache-user", match[1]);
        }
      }
    } catch {
      // Ignore errors (quota exceeded, private browsing, etc)
    }
  };

  window.addEventListener("beforeunload", saveCache);
  
  // Also save periodically to handle tab crashes
  const intervalId = setInterval(saveCache, 30000);

  return {
    get: (key: string) => {
      // If key has a user hash, verify it matches stored user
      // If different user, don't return cached data (will trigger fresh fetch)
      if (key.includes("#user=") && storedUserId) {
        const match = key.match(/#user=([^&]+)/);
        if (match && match[1] !== storedUserId) {
          // Different user - clear cache and return undefined
          map.clear();
          localStorage.removeItem("swr-cache");
          localStorage.removeItem("swr-cache-user");
          return undefined;
        }
      }
      return map.get(key);
    },
    set: (key: string, value: { data: unknown; isLoading: boolean; isValidating: boolean; error?: unknown }) => {
      map.set(key, value);
    },
    delete: (key: string) => {
      map.delete(key);
    },
    keys: () => map.keys(),
  };
}

interface SWRCacheProviderProps {
  children: React.ReactNode;
}

export function SWRCacheProvider({ children }: SWRCacheProviderProps) {
  return (
    <SWRConfig
      value={{
        provider: localStorageProvider,
        // Global SWR config to persist cache across navigation
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: true, // Revalidate stale cache on mount with fresh data
        dedupingInterval: 60000, // 60 seconds - prevent duplicate requests
        focusThrottleInterval: 60000, // Throttle focus revalidation
      }}
    >
      {children}
    </SWRConfig>
  );
}

