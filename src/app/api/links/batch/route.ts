import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MetadataService } from "@/features/links/services/metadata.service";

type BatchAction = "add" | "delete" | "restore" | "permanent_delete" | "pin" | "unpin";

interface LinkData {
  url: string;
  title?: string;
  content_type?: string;
  category_id?: string;
  favicon_url?: string;
}

interface CreatedLink {
  id: string;
  url: string;
  title?: string;
  content_type?: string;
  favicon_url?: string;
  description?: string;
  og_image_url?: string;
}

interface BatchRequest {
  action: BatchAction;
  ids?: string[];
  links?: LinkData[];
}

/**
 * POST /api/links/batch
 * Perform atomic batch operations on links
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: BatchRequest = await request.json();
    const { action, ids, links } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Invalid request: action required" },
        { status: 400 }
      );
    }

    // Validate based on action type
    if (action === "add") {
      if (!links || !Array.isArray(links) || links.length === 0) {
        return NextResponse.json(
          { error: "Invalid request: links array required for add action" },
          { status: 400 }
        );
      }
    } else {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { error: "Invalid request: ids array required" },
          { status: 400 }
        );
      }
    }

    let result;

    switch (action) {
      case "add":
        result = await supabase.rpc("batch_add_links", {
          p_user_id: user.id,
          p_links: links,
        });
        
        // Enrich links with metadata immediately
        if (!result.error && result.data?.links) {
          const metadataService = new MetadataService();
          const enrichedLinks: CreatedLink[] = [];
          
          // Fetch metadata for all links in parallel
          const metadataPromises = result.data.links.map(async (link: CreatedLink) => {
            if (link.content_type === "url" || !link.content_type) {
              try {
                const metadata = await metadataService.fetchMetadata(link.url);
                
                // Update link in database with metadata
                if (metadata.title || metadata.favicon || metadata.description) {
                  const { data: updatedLink } = await supabase
                    .from("links")
                    .update({
                      title: metadata.title || link.title,
                      favicon_url: metadata.favicon || link.favicon_url,
                      description: metadata.description || link.description,
                      og_image_url: metadata.ogImage || link.og_image_url,
                    })
                    .eq("id", link.id)
                    .select()
                    .single();
                  
                  return updatedLink || { ...link, ...metadata };
                }
              } catch (err) {
                console.error(`Metadata fetch failed for ${link.url}:`, err);
              }
            }
            return link;
          });
          
          const enrichedResults = await Promise.all(metadataPromises);
          result.data.links = enrichedResults;
        }
        break;

      case "delete":
        // Direct query instead of RPC to avoid type issues
        const deleteResult = await supabase
          .from("links")
          .update({ is_deleted: true, deleted_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .in("id", ids!);
        result = { data: { count: ids!.length }, error: deleteResult.error };
        break;

      case "restore":
        const restoreResult = await supabase
          .from("links")
          .update({ is_deleted: false, is_archived: false, deleted_at: null })
          .eq("user_id", user.id)
          .in("id", ids!);
        result = { data: { count: ids!.length }, error: restoreResult.error };
        break;

      case "permanent_delete":
        const permDeleteResult = await supabase
          .from("links")
          .delete()
          .eq("user_id", user.id)
          .in("id", ids!);
        result = { data: { count: ids!.length }, error: permDeleteResult.error };
        break;

      case "pin":
        const pinResult = await supabase
          .from("links")
          .update({ is_pinned: true })
          .eq("user_id", user.id)
          .in("id", ids!);
        result = { data: { count: ids!.length }, error: pinResult.error };
        break;

      case "unpin":
        const unpinResult = await supabase
          .from("links")
          .update({ is_pinned: false })
          .eq("user_id", user.id)
          .in("id", ids!);
        result = { data: { count: ids!.length }, error: unpinResult.error };
        break;

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }

    if (result.error) {
      console.error(`Batch ${action} error:`, result.error);
      return NextResponse.json(
        { error: `Failed to ${action} links` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      ...result.data,
    });
  } catch (error) {
    console.error("Error in POST /api/links/batch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

