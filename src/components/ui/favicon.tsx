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
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [allFailed, setAllFailed] = React.useState(false);

  // Build fallback chain with multiple high-quality sources
  const sources = React.useMemo(() => {
    const fallbacks: string[] = [];
    
    // 1. Provided favicon URL (if available and not already a low-res Google fallback)
    if (url && !url.includes("google.com/s2/favicons?") && !url.includes("&sz=16") && !url.includes("&sz=32")) {
      fallbacks.push(url);
    }
    
    // 2. Try direct favicon.ico first (most reliable for standard sites)
    try {
      const urlObj = new URL(`https://${domain}`);
      fallbacks.push(`${urlObj.protocol}//${urlObj.host}/favicon.ico`);
    } catch {
      // If domain is invalid, skip this fallback
    }
    
    // 3. Google favicon with maximum size (256x256) - very reliable
    fallbacks.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=256`);
    
    // 4. Try Clearbit Logo API (very high quality, supports many domains)
    fallbacks.push(`https://logo.clearbit.com/${domain}`);
    
    // 5. DuckDuckGo icon service
    fallbacks.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    
    // 6. Favicon.io service (another reliable option)
    fallbacks.push(`https://api.faviconkit.com/${domain}/256`);
    
    return fallbacks;
  }, [url, domain]);

  // Reset state when URL/domain changes
  React.useEffect(() => {
    setCurrentSource(0);
    setIsLoaded(false);
    setAllFailed(false);
  }, [url, domain]);

  const handleError = React.useCallback(() => {
    // Try next source in the fallback chain, but limit retries to 3 attempts
    if (currentSource < Math.min(2, sources.length - 1)) {
      setCurrentSource((prev) => prev + 1);
    } else {
      // Max retries reached, keep showing placeholder
      setAllFailed(true);
    }
  }, [currentSource, sources.length]);

  const handleLoad = React.useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    // Verify the image actually loaded (not a broken image icon)
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setIsLoaded(true);
    } else {
      handleError();
    }
  }, [handleError]);

  // If all attempts failed, just show placeholder
  if (allFailed) {
    return (
      <div 
        className={cn(
          "h-5 w-5 flex-shrink-0 rounded bg-gray-200",
          className
        )} 
      />
    );
  }

  // Show placeholder while loading, then fade in image once loaded
  return (
    <div className="relative h-5 w-5 flex-shrink-0">
      {/* Always show placeholder, hide when image loads */}
      <div 
        className={cn(
          "absolute inset-0 rounded bg-gray-200",
          isLoaded && "hidden",
          className
        )} 
      />
      <img
        key={`${domain}-${currentSource}`}
        src={sources[currentSource]}
        alt={alt}
        className={cn(
          "h-5 w-5 flex-shrink-0 rounded object-cover antialiased transition-opacity duration-200",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onError={handleError}
        onLoad={handleLoad}
        loading="eager"
        style={{ 
          // High quality image rendering
          imageRendering: "-webkit-optimize-contrast",
          // Hardware acceleration for smoother rendering
          transform: "translateZ(0)",
          // Ensure image is scaled smoothly
          backfaceVisibility: "hidden",
        }}
      />
    </div>
  );
}

