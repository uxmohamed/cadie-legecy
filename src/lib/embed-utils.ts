import type { Link } from "@/features/links/types";

/**
 * Embed type information for rendering previews
 */
export type EmbedType = "youtube" | "twitter" | "color" | "image" | "favicon";

export interface EmbedInfo {
  type: EmbedType;
  embedId?: string; // YouTube video ID or Tweet ID
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports:
 * - youtube.com/watch?v=ID
 * - youtu.be/ID
 * - youtube.com/embed/ID
 * - youtube.com/shorts/ID
 * - youtube.com/v/ID
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace("www.", "");

    // youtube.com/watch?v=ID
    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      // Check for /watch?v=ID
      const vParam = urlObj.searchParams.get("v");
      if (vParam) return vParam;

      // Check for /embed/ID, /shorts/ID, /v/ID
      const pathMatch = urlObj.pathname.match(
        /^\/(embed|shorts|v)\/([a-zA-Z0-9_-]{11})/
      );
      if (pathMatch) return pathMatch[2];
    }

    // youtu.be/ID
    if (hostname === "youtu.be") {
      const match = urlObj.pathname.match(/^\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract Tweet ID from Twitter/X URL formats
 * Supports:
 * - twitter.com/user/status/ID
 * - x.com/user/status/ID
 * - mobile.twitter.com/user/status/ID
 */
export function extractTweetId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace("www.", "").replace("mobile.", "");

    if (hostname === "twitter.com" || hostname === "x.com") {
      // Match /username/status/ID pattern
      const match = urlObj.pathname.match(/\/[^/]+\/status\/(\d+)/);
      if (match) return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Detect the embed type for a link based on its content
 * Priority:
 * 1. Color content type
 * 2. YouTube patterns
 * 3. Twitter/X patterns
 * 4. OG Image fallback
 * 5. Favicon fallback
 */
export function detectEmbedType(link: Link): EmbedInfo {
  // 1. Color content type
  if (link.content_type === "color") {
    return { type: "color" };
  }

  // 1b. Image content type
  if (link.content_type === "image") {
    return { type: "image" };
  }

  // 2. YouTube patterns
  const youtubeId = extractYouTubeId(link.url);
  if (youtubeId) {
    return { type: "youtube", embedId: youtubeId };
  }

  // 3. Twitter/X patterns
  const tweetId = extractTweetId(link.url);
  if (tweetId) {
    return { type: "twitter", embedId: tweetId };
  }

  // 4. OG Image fallback
  if (link.og_image_url) {
    return { type: "image" };
  }

  // 5. Favicon fallback
  return { type: "favicon" };
}

/**
 * Generate YouTube embed URL from video ID
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

/**
 * Check if a URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Check if a URL is a Twitter/X post
 */
export function isTwitterUrl(url: string): boolean {
  return extractTweetId(url) !== null;
}
