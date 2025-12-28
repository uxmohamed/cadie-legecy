"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// Global Favicon Cache
// =============================================================================

/**
 * Global cache to track successfully loaded favicons
 * Persists across component re-renders and unmounts
 */
const faviconCache = new Map<string, {
  loadedUrl: string;        // The URL that successfully loaded
  timestamp: number;        // When it was cached
}>();

/**
 * Cache a successfully loaded favicon
 */
function cacheLoadedFavicon(cacheKey: string, loadedUrl: string) {
  faviconCache.set(cacheKey, {
    loadedUrl,
    timestamp: Date.now(),
  });
}

/**
 * Get cached favicon if available
 */
function getCachedFavicon(cacheKey: string): string | null {
  const cached = faviconCache.get(cacheKey);
  if (cached) {
    // Cache expires after 1 hour
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - cached.timestamp < ONE_HOUR) {
      return cached.loadedUrl;
    }
    // Remove expired cache
    faviconCache.delete(cacheKey);
  }
  return null;
}

// =============================================================================
// Component
// =============================================================================

interface FaviconProps {
  url: string;
  domain: string;
  className?: string;
  alt?: string;
}

/**
 * Fallback placeholder - light gray rectangle
 */
function FaviconFallback({ className, isLoading = false }: { className?: string; isLoading?: boolean }) {
  return (
    <div
      className={cn(
        "h-5 w-5 flex-shrink-0 rounded-[3px] bg-[var(--bg-field-default)]",
        isLoading && "animate-pulse",
        className
      )}
    />
  );
}

/**
 * Check if domain is local/internal
 */
function isLocalDomain(domain: string): boolean {
  return (
    domain === "localhost" ||
    domain.startsWith("localhost:") ||
    domain === "127.0.0.1" ||
    domain.startsWith("127.0.0.1:") ||
    domain.startsWith("192.168.") ||
    domain.startsWith("10.") ||
    domain.endsWith(".local")
  );
}

/**
 * Generate cache key for a favicon
 */
function getCacheKey(url: string, domain: string): string {
  return `${domain}:${url || "default"}`;
}

/**
 * Smart favicon component with progressive fallbacks and caching
 * Once a favicon loads successfully, it's cached to prevent re-loading on re-renders
 */
export function Favicon({ url, domain, className, alt = "" }: FaviconProps) {
  const cacheKey = getCacheKey(url, domain);
  const cachedUrl = getCachedFavicon(cacheKey);
  
  // If we have a cached URL, use it directly without fallback logic
  const [currentSource, setCurrentSource] = React.useState(() => {
    if (cachedUrl) return -1; // -1 indicates using cached URL
    return 0;
  });
  const [allFailed, setAllFailed] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(() => !!cachedUrl);

  // For local domains, immediately show fallback
  const isLocal = isLocalDomain(domain);

  // Build fallback chain - skip external services for local domains
  const sources = React.useMemo(() => {
    if (isLocal) {
      // Only try the provided URL for local domains
      return url ? [url] : [];
    }

    const fallbacks: string[] = [];

    // 1. Provided favicon URL (if available and not a low-res Google fallback)
    if (
      url &&
      !url.includes("google.com/s2/favicons?") &&
      !url.includes("&sz=16") &&
      !url.includes("&sz=32")
    ) {
      fallbacks.push(url);
    }

    // 2. Try Clearbit Logo API (high quality)
    fallbacks.push(`https://logo.clearbit.com/${domain}`);

    // 3. Try direct favicon.ico
    try {
      const urlObj = new URL(`https://${domain}`);
      fallbacks.push(`${urlObj.protocol}//${urlObj.host}/favicon.ico`);
    } catch {
      // Skip if domain is invalid
    }

    return fallbacks;
  }, [url, domain, isLocal]);

  // Get the current image URL to display
  const currentImageUrl = React.useMemo(() => {
    if (cachedUrl && currentSource === -1) {
      return cachedUrl;
    }
    if (currentSource >= 0 && currentSource < sources.length) {
      return sources[currentSource];
    }
    return null;
  }, [cachedUrl, currentSource, sources]);

  // Reset state when URL/domain changes (but check cache first)
  React.useEffect(() => {
    const newCachedUrl = getCachedFavicon(cacheKey);
    if (newCachedUrl) {
      setCurrentSource(-1);
      setImageLoaded(true);
      setAllFailed(false);
    } else {
      setCurrentSource(0);
      setAllFailed(false);
      setImageLoaded(false);
    }
  }, [cacheKey]);

  const handleError = React.useCallback(() => {
    // If using cached URL and it fails, start from beginning
    if (currentSource === -1) {
      faviconCache.delete(cacheKey);
      setCurrentSource(0);
      setImageLoaded(false);
      return;
    }
    
    if (currentSource < sources.length - 1) {
      setCurrentSource((prev) => prev + 1);
    } else {
      setAllFailed(true);
    }
  }, [currentSource, sources.length, cacheKey]);

  const handleLoad = React.useCallback(() => {
    setImageLoaded(true);
    
    // Cache the successfully loaded URL
    if (currentImageUrl && currentSource !== -1) {
      cacheLoadedFavicon(cacheKey, currentImageUrl);
    }
  }, [cacheKey, currentImageUrl, currentSource]);

  // Show fallback if: all sources failed, no sources available, or local domain with no URL
  if (allFailed || (!currentImageUrl && sources.length === 0)) {
    return <FaviconFallback className={className} isLoading={false} />;
  }

  // If no image URL available, show loading fallback
  if (!currentImageUrl) {
    return <FaviconFallback className={className} isLoading={true} />;
  }

  // Render image with fallback shown underneath until loaded
  return (
    <div className={cn("relative h-5 w-5 flex-shrink-0", className)}>
      {/* Show fallback until image loads successfully */}
      {!imageLoaded && (
        <div className="absolute inset-0">
          <FaviconFallback className="h-full w-full" isLoading={true} />
        </div>
      )}
      <img
        src={currentImageUrl}
        alt={alt}
        className={cn(
          "h-full w-full rounded object-cover",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}
