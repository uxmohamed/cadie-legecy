"use client";

import * as React from "react";
import { useRef, useState, useEffect } from "react";
import type { Link } from "@/features/links/types";
import { detectEmbedType, getYouTubeEmbedUrl } from "@/lib/embed-utils";
import { Favicon } from "@/components/ui/favicon";
import { IconWorld, IconBrandX, IconFileTypePdf, IconExternalLink, IconNotes } from "@tabler/icons-react";
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
    <div className="w-full h-full relative rounded-sm overflow-hidden border border-black/5">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(45deg, rgba(0,0,0,0.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.12) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.12) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.12) 75%)",
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: colorValue }}
      />
      <div className="absolute left-4 bottom-4 z-10 px-3 py-2 rounded-lg bg-black/35 backdrop-blur-md border border-white/25">
        <p className="text-[10px] uppercase tracking-wide text-white/80 mb-0.5">
          Color
        </p>
        <code className="text-white font-mono text-sm md:text-base font-semibold drop-shadow-sm">
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
    <div className="w-full h-full bg-bg-muted/30 flex items-center justify-center rounded-sm overflow-hidden">
      <img
        src={imageSrc}
        alt={link.title}
        className="w-full h-full object-contain"
      />
    </div>
  );
}


/**
 * PDF document preview with graceful fallback
 */
function DocumentPreview({ link }: { link: Link }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const previewUrl = React.useMemo(() => {
    if (link.url.includes("#")) return link.url;
    return `${link.url}#view=FitH`;
  }, [link.url]);

  return (
    <div className="w-full h-full relative bg-bg-surface">
      {!hasError ? (
        <iframe
          src={previewUrl}
          title={link.title || "PDF document preview"}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-bg-muted/20">
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="h-16 w-16 rounded-2xl bg-bg flex items-center justify-center border border-border-muted">
              <IconFileTypePdf className="h-8 w-8 text-fg-subtle" />
            </div>
            <div>
              <p className="text-sm font-medium text-fg">Preview unavailable</p>
              <p className="text-xs text-fg-subtle mt-1">This browser cannot render this PDF inline.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
            >
              <IconExternalLink className="h-4 w-4 mr-1.5" />
              Open PDF
            </Button>
          </div>
        </div>
      )}

      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/45 backdrop-blur-[1px]">
          <Spinner />
        </div>
      )}

      <Button
        variant="secondary"
        size="sm"
        className="absolute top-3 right-3 bg-bg/80 hover:bg-bg"
        onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
      >
        <IconExternalLink className="h-4 w-4 mr-1.5" />
        Open
      </Button>
    </div>
  );
}


function NotePreview({ link }: { link: Link }) {
  return (
    <div className="w-full h-full bg-bg-surface p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-3 text-fg-subtle">
          <IconNotes className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wide">Note</span>
        </div>
        <h3 className="text-xl font-semibold text-fg mb-3">{link.title}</h3>
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-fg"
          dangerouslySetInnerHTML={{ __html: link.content_text || link.notes || "" }}
        />
      </div>
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
    case "document":
      return <DocumentPreview link={link} />;
    case "note":
      return <NotePreview link={link} />;
    case "favicon":
    default:
      return <FaviconPreview link={link} />;
  }
}
