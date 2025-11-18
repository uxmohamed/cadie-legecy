import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInitialRichTextState } from "@/lib/rich-text-utils";
import { authenticateRequest } from "@/lib/auth-middleware";
import { extractMetadata } from "@/lib/metadata";

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("category_id");
    const isArchived = searchParams.get("is_archived") === "true";
    
    let query = supabase
      .from("links")
      .select("*")
      .eq("user_id", userId)
      .eq("is_archived", isArchived)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ links: data });
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const body = await request.json();
    let { url, title, content_type = "url", category_id, color_value, favicon_url, og_image_url, description, rich_text_content } = body;

    if (!url || !title) {
      return NextResponse.json(
        { error: "URL and title are required" },
        { status: 400 }
      );
    }

    // Auto-fetch metadata if not provided and content type is URL
    if (content_type === "url" && (!favicon_url || !og_image_url || !description)) {
      try {
        console.log("Auto-fetching metadata for URL:", url);
        const metadata = await extractMetadata(url);
        
        // Only override if not already provided
        if (!favicon_url && metadata.favicon) {
          favicon_url = metadata.favicon;
        }
        if (!og_image_url && metadata.ogImage) {
          og_image_url = metadata.ogImage;
        }
        if (!description && metadata.description) {
          description = metadata.description;
        }
        // Update title if it was generic and we got a better one
        if (title === url && metadata.title !== metadata.domain) {
          title = metadata.title;
        }
        
        console.log("Metadata fetched successfully:", { 
          favicon: !!favicon_url, 
          ogImage: !!og_image_url, 
          description: !!description 
        });
      } catch (error) {
        // Don't fail the request if metadata fetch fails, just log it
        console.error("Failed to auto-fetch metadata:", error);
      }
    }

    // Extract domain from URL or set to "color" for color entries, or "text" for text entries
    let domain = "";
    if (content_type === "color") {
      domain = "color";
    } else if (content_type === "text") {
      domain = "text";
    } else {
      try {
        domain = new URL(url).hostname.replace("www.", "");
      } catch {
        domain = url;
      }
    }

    // Normalize URL for duplicate checking (remove trailing slash, query params, fragments)
    let normalizedUrl = url;
    try {
      const urlObj = new URL(url);
      // Remove trailing slash, hash, and some query params for comparison
      normalizedUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname.replace(/\/$/, '')}`;
    } catch {
      // If URL parsing fails, use original
      normalizedUrl = url;
    }

    // Check for duplicates - if same URL exists for this user, return existing link
    // Check both exact match and normalized match
    const { data: existingLinks } = await supabase
      .from("links")
      .select("*")
      .eq("user_id", userId)
      .eq("is_archived", false);

    // Check if any existing link matches
    const existingLink = existingLinks?.find(link => {
      if (link.url === url) return true;
      
      // Also check normalized URLs
      try {
        const existingUrlObj = new URL(link.url);
        const existingNormalized = `${existingUrlObj.protocol}//${existingUrlObj.host}${existingUrlObj.pathname.replace(/\/$/, '')}`;
        return existingNormalized === normalizedUrl;
      } catch {
        return false;
      }
    });

    if (existingLink) {
      // Link already exists, return it instead of creating duplicate
      console.log("Duplicate link detected:", { existing: existingLink.url, new: url });
      return NextResponse.json({ link: existingLink, duplicate: true }, { status: 200 });
    }

    // For text content type, create initial rich text state if not provided
    let richTextContent = rich_text_content || null;
    if (content_type === "text" && !richTextContent) {
      richTextContent = createInitialRichTextState(title);
    }

    const { data, error } = await supabase
      .from("links")
      .insert({
        user_id: userId,
        url,
        clean_url: url, // TODO: Implement URL cleaning
        title,
        domain,
        content_type,
        category_id: category_id || null,
        color_value: color_value || null,
        rich_text_content: richTextContent,
        favicon_url: favicon_url || null,
        og_image_url: og_image_url || null,
        description: description || null,
        is_pinned: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ link: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

