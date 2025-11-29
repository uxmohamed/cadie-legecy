import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractMetadata } from "@/lib/metadata";

export const runtime = 'edge';

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

    const supabase = await createClient();

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

    // Skip if already has complete metadata
    if (link.favicon_url && link.og_image_url && link.description) {
      return NextResponse.json({ 
        message: "Link already has metadata",
        updated: false 
      });
    }

    // Extract metadata with timeout
    const metadata = await extractMetadata(link.url);

    // Update the link with fetched metadata
    const updates: any = {};
    
    if (!link.favicon_url && metadata.favicon) {
      updates.favicon_url = metadata.favicon;
    }
    if (!link.og_image_url && metadata.ogImage) {
      updates.og_image_url = metadata.ogImage;
    }
    if (!link.description && metadata.description) {
      updates.description = metadata.description;
    }
    // Update title if it was generic and we got a better one
    if (link.title === link.url && metadata.title !== metadata.domain) {
      updates.title = metadata.title;
    }

    // Only update if we have new data
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        message: "No new metadata available",
        updated: false 
      });
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
