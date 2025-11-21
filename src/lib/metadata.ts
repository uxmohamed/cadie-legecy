import * as cheerio from "cheerio";

export interface LinkMetadata {
  title: string;
  description?: string;
  favicon?: string;
  ogImage?: string;
  domain: string;
}

export async function extractMetadata(url: string): Promise<LinkMetadata> {
  // Create timeout for metadata extraction (10 seconds max)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CaddyBot/1.0; +https://caddy.app)",
      },
      signal: controller.signal,
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    let title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      $("h1").first().text() ||
      "Untitled";

    title = title.trim();

    // Extract description
    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      undefined;

    // Extract Open Graph image
    const ogImage = $('meta[property="og:image"]').attr("content") || undefined;

    // Extract favicon - prioritize high-resolution icons
    let favicon =
      $('link[rel="apple-touch-icon"]').attr("href") ||
      $('link[rel="apple-touch-icon-precomposed"]').attr("href") ||
      $('link[rel="icon"][sizes="192x192"]').attr("href") ||
      $('link[rel="icon"][sizes="128x128"]').attr("href") ||
      $('link[rel="icon"][type="image/png"]').attr("href") ||
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      undefined;

    // Make favicon URL absolute
    if (favicon && !favicon.startsWith("http")) {
      const urlObj = new URL(url);
      if (favicon.startsWith("//")) {
        favicon = `${urlObj.protocol}${favicon}`;
      } else if (favicon.startsWith("/")) {
        favicon = `${urlObj.protocol}//${urlObj.host}${favicon}`;
      } else {
        favicon = `${urlObj.protocol}//${urlObj.host}/${favicon}`;
      }
    }

    // Fallback options - use Clearbit for best quality
    if (!favicon) {
      const domain = new URL(url).hostname;
      
      // Use Clearbit Logo API as primary fallback (high quality, well-maintained)
      // The frontend Favicon component will handle additional fallbacks if this fails
      favicon = `https://logo.clearbit.com/${domain}`;
    }

    // Extract domain
    const domain = new URL(url).hostname.replace("www.", "");

    return {
      title,
      description,
      favicon,
      ogImage,
      domain,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Log different error types
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("Metadata extraction timeout for:", url);
    } else {
      console.error("Error extracting metadata:", error);
    }
    
    // Return fallback metadata
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace("www.", "");
    return {
      title: domain,
      domain,
      favicon: `https://logo.clearbit.com/${domain}`,
    };
  }
}

