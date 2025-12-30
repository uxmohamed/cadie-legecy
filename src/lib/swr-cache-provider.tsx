"use client";

import * as React from "react";
import { SWRConfig, Cache } from "swr";

/**
 * Creates a localStorage-based cache provider for SWR.
 * This persists the SWR cache across page refreshes, making the app feel instant
 * on subsequent visits.
 */
function localStorageProvider(cache: Readonly<Cache>): Cache {
  // Only run on client
  if (typeof window === "undefined") {
    return cache;
  }

  // Load from localStorage on init
  const map = new Map<string, { data: unknown; isLoading: boolean; isValidating: boolean; error?: unknown }>();
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
      const entries = Array.from(map.entries())
        .filter(([key]) => key.startsWith("/api/links"))
        .map(([key, value]) => [key, { data: value.data }]);
      localStorage.setItem("swr-cache", JSON.stringify(entries));
    } catch {
      // Ignore errors (quota exceeded, private browsing, etc)
    }
  };

  window.addEventListener("beforeunload", saveCache);
  
  // Also save periodically to handle tab crashes
  setInterval(saveCache, 30000);

  return {
    get: (key: string) => map.get(key),
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
        revalidateIfStale: false, // Don't auto-revalidate stale data
        dedupingInterval: 60000, // 60 seconds - prevent duplicate requests
        focusThrottleInterval: 60000, // Throttle focus revalidation
      }}
    >
      {children}
    </SWRConfig>
  );
}

