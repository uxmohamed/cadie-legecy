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
 * Smart favicon component with progressive fallbacks
 * Tries multiple sources in order of quality:
 * 1. Provided favicon URL (usually from page metadata)
 * 2. Direct /favicon.ico from the domain
 * 3. DuckDuckGo's icon service (good quality, reliable)
 * 4. Google's favicon service (128x128 for higher resolution)
 * 5. Final fallback: gray box
 */
export function Favicon({ url, domain, className, alt = "" }: FaviconProps) {
  const [currentSource, setCurrentSource] = React.useState(0);
  const [hasError, setHasError] = React.useState(false);

  // Build fallback chain with multiple high-quality sources
  const sources = React.useMemo(() => {
    const fallbacks: string[] = [];
    
    // 1. Provided favicon URL (if available and not already a low-res Google fallback)
    if (url && !url.includes("google.com/s2/favicons?") && !url.includes("&sz=16") && !url.includes("&sz=32")) {
      fallbacks.push(url);
    }
    
    // 2. Try Clearbit Logo API (very high quality, supports many domains)
    fallbacks.push(`https://logo.clearbit.com/${domain}`);
    
    // 3. Google favicon with maximum size (256x256)
    fallbacks.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=256`);
    
    // 4. Try direct favicon.ico
    try {
      const urlObj = new URL(`https://${domain}`);
      fallbacks.push(`${urlObj.protocol}//${urlObj.host}/favicon.ico`);
    } catch {
      // If domain is invalid, skip this fallback
    }
    
    // 5. DuckDuckGo icon service
    fallbacks.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    
    // 6. Favicon.io service (another reliable option)
    fallbacks.push(`https://api.faviconkit.com/${domain}/256`);
    
    return fallbacks;
  }, [url, domain]);

  // Reset state when URL/domain changes
  React.useEffect(() => {
    setCurrentSource(0);
    setHasError(false);
  }, [url, domain]);

  const handleError = React.useCallback(() => {
    // Try next source in the fallback chain
    if (currentSource < sources.length - 1) {
      setCurrentSource((prev) => prev + 1);
    } else {
      // All sources failed, show error state
      setHasError(true);
    }
  }, [currentSource, sources.length]);

  // If all sources failed, show placeholder with globe icon
  if (hasError || sources.length === 0) {
    return (
      <div
        className={cn(
          "h-5 w-5 flex-shrink-0 rounded bg-neutral-100 flex items-center justify-center",
          className
        )}
      >
        <svg
          className="h-3 w-3 text-neutral-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={sources[currentSource]}
      alt={alt}
      className={cn("h-5 w-5 flex-shrink-0 rounded object-cover antialiased", className)}
      onError={handleError}
      loading="lazy"
      style={{ 
        // High quality image rendering
        imageRendering: "-webkit-optimize-contrast",
        // Hardware acceleration for smoother rendering
        transform: "translateZ(0)",
        // Ensure image is scaled smoothly
        backfaceVisibility: "hidden",
      }}
    />
  );
}

