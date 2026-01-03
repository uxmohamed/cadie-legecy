import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { extractMetadata } from "@/lib/metadata";


interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // This is an internal endpoint for background processing
    // Check if this is an internal request
    const isInternal = request.headers.get('X-Internal-Request') === 'true';
    
    if (!isInternal) {
      return NextResponse.json(
        { error: "This endpoint is for internal use only" },
        { status: 403 }
      );
    }

    // Use admin client to bypass RLS since this is a background job
    const supabase = createAdminClient();

    // Get the link from database
    const { data: link, error: fetchError } = await supabase
      .from("links")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !link) {
      console.error("Link not found for metadata fetch:", id);
      return NextResponse.json(
        { error: "Link not found" },
        { status: 404 }
      );
    }

    // Skip if content type is not URL
    if (link.content_type && link.content_type !== "url") {
      return NextResponse.json({ 
        message: "Skipping non-URL content type",
        updated: false 
      });
    }

    // Skip if already has complete metadata with success status
    if (link.fetch_status === "success" && link.favicon_url && link.description) {
      return NextResponse.json({ 
        message: "Link already has complete metadata",
        updated: false 
      });
    }

    // Extract comprehensive metadata
    const metadata = await extractMetadata(link.url);

    // Build update object with all new metadata fields
    const updates: Record<string, unknown> = {
      fetch_status: metadata.fetch_status,
      fetched_at: metadata.fetched_at,
    };
    
    // Core fields - update if missing or if we got better data
    if (!link.favicon_url && metadata.favicon_url) {
      updates.favicon_url = metadata.favicon_url;
    }
    if (!link.og_image_url && metadata.preview_image_url) {
      updates.og_image_url = metadata.preview_image_url;
    }
    if (!link.description && metadata.description) {
      updates.description = metadata.description;
    }
    // Update title if it was generic (equals URL or domain) and we got a better one
    const hasGenericTitle = !link.title || link.title === link.url || link.title === link.domain;
    if (hasGenericTitle && metadata.title && metadata.title !== metadata.domain) {
      updates.title = metadata.title;
    }
    
    // Extended metadata fields - always update if available
    if (metadata.site_name) {
      updates.site_name = metadata.site_name;
    }
    if (metadata.final_url) {
      updates.final_url = metadata.final_url;
    }
    if (metadata.canonical_url) {
      updates.canonical_url = metadata.canonical_url;
    }
    if (metadata.favicon_variants && metadata.favicon_variants.length > 0) {
      updates.favicon_variants = metadata.favicon_variants;
    }
    if (metadata.preview_image_width) {
      updates.preview_image_width = metadata.preview_image_width;
    }
    if (metadata.preview_image_height) {
      updates.preview_image_height = metadata.preview_image_height;
    }
    if (metadata.theme_color) {
      updates.theme_color = metadata.theme_color;
    }
    if (metadata.language) {
      updates.language = metadata.language;
    }
    if (metadata.word_count) {
      updates.word_count = metadata.word_count;
    }
    if (metadata.reading_time_minutes) {
      updates.reading_time_minutes = metadata.reading_time_minutes;
    }
    if (metadata.status_code) {
      updates.status_code = metadata.status_code;
    }
    if (metadata.etag) {
      updates.etag = metadata.etag;
    }
    if (metadata.last_modified) {
      updates.last_modified = metadata.last_modified;
    }

    const { error: updateError } = await supabase
      .from("links")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update link metadata:", updateError);
      return NextResponse.json(
        { error: "Failed to update metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Metadata updated successfully",
      updated: true,
      fetch_status: metadata.fetch_status,
      fields: Object.keys(updates)
    });
  } catch (error) {
    console.error("Error in background metadata fetch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
