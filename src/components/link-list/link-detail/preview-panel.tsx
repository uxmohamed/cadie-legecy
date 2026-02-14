"use client";

import * as React from "react";
import { useRef, useState, useEffect } from "react";
import type { Link } from "@/features/links/types";
import { detectEmbedType, getYouTubeEmbedUrl } from "@/lib/embed-utils";
import { Favicon } from "@/components/ui/favicon";
import { IconWorld, IconBrandX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTheme } from "@/components/theme-provider";

interface PreviewPanelProps {
  link: Link;
}

/**
 * YouTube embed preview with responsive iframe
 */
function YouTubePreview({ videoId }: { videoId: string }) {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <iframe
        src={getYouTubeEmbedUrl(videoId)}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

/**
 * Fallback Twitter preview - OG image with overlay button
 */
function FallbackTwitterPreview({ link }: { link: Link }) {
  return (
    <div className="w-full h-full relative bg-bg-surface flex items-center justify-center">
      {link.og_image_url ? (
        <img
          src={link.og_image_url}
          alt={link.title}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#000000]">
          <IconBrandX className="h-20 w-20 text-white" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="sm"
          className="bg-white/90 hover:bg-white text-black shadow-lg"
          onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
        >
          <IconBrandX className="h-4 w-4 mr-1.5" />
          View on X
        </Button>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          tweetId: string,
          container: HTMLElement,
          options?: Record<string, unknown>
        ) => Promise<HTMLElement | undefined>;
      };
    };
  }
}

function loadTwitterWidgets(): Promise<void> {
  if (window.twttr) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Twitter widgets"));
    document.head.appendChild(script);
  });
}

function useEffectiveTheme(): "light" | "dark" {
  const { theme } = useTheme();
  const [effective, setEffective] = useState<"light" | "dark">("dark");

  useEffect(() => {
    if (theme !== "system") {
      setEffective(theme);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setEffective(mq.matches ? "dark" : "light");
    const handler = (e: MediaQueryListEvent) => setEffective(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return effective;
}

/**
 * Twitter/X embedded tweet preview
 */
function TwitterPreview({ tweetId, link }: { tweetId: string; link: Link }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const effectiveTheme = useEffectiveTheme();

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    // Clear previous embed when tweetId or theme changes
    container.innerHTML = "";
    setLoading(true);
    setError(false);

    async function embedTweet() {
      try {
        await loadTwitterWidgets();
        if (cancelled || !container) return;
        const el = await window.twttr!.widgets.createTweet(tweetId, container, {
          conversation: "none",
          dnt: true,
          theme: effectiveTheme,
          width: 550,
        });
        if (cancelled) return;
        if (!el) {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    embedTweet();
    return () => {
      cancelled = true;
      // Remove any DOM nodes injected by a still-in-flight createTweet
      if (container) container.innerHTML = "";
    };
  }, [tweetId, effectiveTheme]);

  if (error) return <FallbackTwitterPreview link={link} />;

  return (
    <div className="w-full h-full overflow-auto flex items-center justify-center bg-bg-surface relative p-4">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </div>
      )}
      <div ref={containerRef} className="w-full max-w-[550px]" />
    </div>
  );
}

/**
 * Color swatch preview with full panel coverage
 */
function ColorPreview({ colorValue }: { colorValue: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: colorValue }}
      />
      <div className="relative z-10 px-4 py-2 rounded-lg bg-black/20 backdrop-blur-sm">
        <code className="text-white font-mono text-lg font-medium drop-shadow-sm">
          {colorValue}
        </code>
      </div>
    </div>
  );
}

/**
 * OG Image preview with object-contain
 */
function ImagePreview({ link }: { link: Link }) {
  const imageSrc = link.content_type === "image" ? link.url : link.og_image_url!;
  return (
    <div className="w-full h-full bg-transparent flex items-center justify-center">
      <img
        src={imageSrc}
        alt={link.title}
        className="w-full h-full object-contain rounded-sm"
      />
    </div>
  );
}

/**
 * Fallback preview with centered scaled favicon
 */
function FaviconPreview({ link }: { link: Link }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-bg-surface">
      {link.domain ? (
        <div className="p-8 rounded-2xl bg-bg">
          <Favicon
            url={link.favicon_url || ""}
            domain={link.domain}
            className="h-20 w-20"
          />
        </div>
      ) : (
        <IconWorld className="h-20 w-20 text-fg-subtle" />
      )}
    </div>
  );
}

/**
 * Preview panel component that renders the appropriate preview
 * based on the link's content type and URL patterns
 */
export function PreviewPanel({ link }: PreviewPanelProps) {
  const embedInfo = detectEmbedType(link);

  switch (embedInfo.type) {
    case "youtube":
      return <YouTubePreview videoId={embedInfo.embedId!} />;
    case "twitter":
      return <TwitterPreview key={embedInfo.embedId} tweetId={embedInfo.embedId!} link={link} />;
    case "color":
      return <ColorPreview colorValue={link.color_value || "#000000"} />;
    case "image":
      return <ImagePreview link={link} />;
    case "favicon":
    default:
      return <FaviconPreview link={link} />;
  }
}

