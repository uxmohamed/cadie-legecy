"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FaviconProps {
  url: string;
  domain: string;
  className?: string;
  alt?: string;
}

/**
 * Fallback placeholder - simple light gray rectangle
 */
function FaviconFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 flex-shrink-0 rounded-[3px]",
        className
      )}
      style={{ backgroundColor: "#E5E5E5" }}
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
 * Smart favicon component with progressive fallbacks
 * Tries multiple sources in order of quality, falls back to gray rectangle
 */
export function Favicon({ url, domain, className, alt = "" }: FaviconProps) {
  const [currentSource, setCurrentSource] = React.useState(0);
  const [allFailed, setAllFailed] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

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

  // Reset state when URL/domain changes
  React.useEffect(() => {
    setCurrentSource(0);
    setAllFailed(false);
    setImageLoaded(false);
  }, [url, domain]);

  const handleError = React.useCallback(() => {
    if (currentSource < sources.length - 1) {
      setCurrentSource((prev) => prev + 1);
    } else {
      setAllFailed(true);
    }
  }, [currentSource, sources.length]);

  const handleLoad = React.useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Show fallback if: all sources failed, no sources available, or local domain with no URL
  if (allFailed || sources.length === 0) {
    return <FaviconFallback className={className} />;
  }

  // Render image with fallback shown underneath until loaded
  return (
    <div className={cn("relative h-5 w-5 flex-shrink-0", className)}>
      {/* Show fallback until image loads successfully */}
      {!imageLoaded && (
        <div className="absolute inset-0">
          <FaviconFallback className="h-full w-full" />
        </div>
      )}
      <img
        src={sources[currentSource]}
        alt={alt}
        className={cn(
          "h-5 w-5 rounded object-cover",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}
