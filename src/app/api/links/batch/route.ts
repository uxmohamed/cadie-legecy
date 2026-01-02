import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MetadataService } from "@/features/links/services/metadata.service";
import { canonicalizeUrl } from "@/lib/canonicalize";
import { rateLimitLinks, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { validateRequestBody } from "@/lib/validation/validate";
import { batchActionSchema } from "@/lib/validation/link.schemas";

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

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

    // Apply rate limiting
    const identifier = getIdentifier(request, user.id);
    const { success, limit, reset, remaining } = await rateLimitLinks.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: getRateLimitHeaders(limit, remaining, reset)
        }
      );
    }

    // Validate request body
    const { data: validatedData, error: validationError } = await validateRequestBody(
      request,
      batchActionSchema
    );
    
    if (validationError) {
      return validationError;
    }

    const { action, ids, links } = validatedData;

    let result;

    switch (action) {
      case "add":
        // Direct insert instead of RPC to ensure proper defaults
        const linksToInsert = links!.map((link) => ({
          user_id: user.id,
          url: link.url,
          clean_url: link.content_type === "color" ? link.url : canonicalizeUrl(link.url),
          title: link.title || link.url,
          content_type: link.content_type || "url",
          category_id: link.category_id || null,
          favicon_url: link.favicon_url || null,
          color_value: (link as any).color_value || null,
          domain: link.content_type === "color" ? "color" : extractDomain(link.url),
          is_deleted: false,
          is_archived: false,
          is_pinned: false,
        }));

        const insertResult = await supabase
          .from("links")
          .insert(linksToInsert)
          .select();

        result = {
          data: {
            links: insertResult.data || [],
            count: insertResult.data?.length || 0,
            restored: 0,
          },
          error: insertResult.error,
        };

        // Enrich links with comprehensive metadata immediately
        if (!result.error && result.data?.links) {
          const metadataService = new MetadataService();

          // Fetch metadata for all URL links in parallel with concurrency control
          const urlLinks = result.data.links.filter(
            (link: CreatedLink) => link.content_type === "url" || !link.content_type
          );

          if (urlLinks.length > 0) {
            // Fetch metadata for all URLs
            const urls = urlLinks.map((link: CreatedLink) => link.url);
            const metadataMap = await metadataService.fetchBatchMetadata(urls, {
              concurrency: 5,
              timeout: 5000,
            });

            // Update each link with comprehensive metadata
            const updatePromises = urlLinks.map(async (link: CreatedLink) => {
              const metadata = metadataMap.get(link.url);
              const domain = metadata?.domain || extractDomain(link.url);

              // Even if metadata fetch failed, at least set the domain
              const updateData: Record<string, unknown> = {
                domain,
              };

              // Add metadata fields if available
              if (metadata) {
                Object.assign(updateData, {
                  title: metadata.title || link.title,
                  favicon_url: metadata.favicon_url || link.favicon_url,
                  description: metadata.description || link.description,
                  og_image_url: metadata.preview_image_url || link.og_image_url,
                  // Extended metadata
                  site_name: metadata.site_name,
                  final_url: metadata.final_url,
                  canonical_url: metadata.canonical_url,
                  favicon_variants: metadata.favicon_variants,
                  preview_image_width: metadata.preview_image_width,
                  preview_image_height: metadata.preview_image_height,
                  theme_color: metadata.theme_color,
                  language: metadata.language,
                  word_count: metadata.word_count,
                  reading_time_minutes: metadata.reading_time_minutes,
                  status_code: metadata.status_code,
                  fetch_status: metadata.fetch_status,
                  fetched_at: metadata.fetched_at,
                  etag: metadata.etag,
                  last_modified: metadata.last_modified,
                });
              }

              try {
                const { data: updatedLink } = await supabase
                  .from("links")
                  .update(updateData)
                  .eq("id", link.id)
                  .select()
                  .single();

                return updatedLink || { ...link, domain };
              } catch (err) {
                console.error(`Metadata update failed for ${link.url}:`, err);
                return { ...link, domain };
              }
            });

            const enrichedUrls = await Promise.all(updatePromises);

            // Merge enriched URLs back with non-URL links
            const nonUrlLinks = result.data.links.filter(
              (link: CreatedLink) => link.content_type && link.content_type !== "url"
            );

            result.data.links = [...nonUrlLinks, ...enrichedUrls];
          }
        }
        break;

      case "delete":
        // Direct query instead of RPC to avoid type issues
        const deleteResult = await supabase
          .from("links")
          .update({ is_deleted: true, deleted_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .in("id", ids!)
          .select();
        result = { data: { count: deleteResult.data?.length || ids!.length }, error: deleteResult.error };
        break;

      case "restore":
        const restoreResult = await supabase
          .from("links")
          .update({ is_deleted: false, is_archived: false, deleted_at: null })
          .eq("user_id", user.id)
          .in("id", ids!)
          .select();
        result = { data: { count: restoreResult.data?.length || ids!.length }, error: restoreResult.error };
        break;

      case "permanent_delete":
        const permDeleteResult = await supabase
          .from("links")
          .delete()
          .eq("user_id", user.id)
          .in("id", ids!)
          .select();
        result = { data: { count: permDeleteResult.data?.length || ids!.length }, error: permDeleteResult.error };
        break;

      case "pin":
        const pinResult = await supabase
          .from("links")
          .update({ is_pinned: true })
          .eq("user_id", user.id)
          .in("id", ids!)
          .select();
        result = { data: { count: pinResult.data?.length || ids!.length }, error: pinResult.error };
        break;

      case "unpin":
        const unpinResult = await supabase
          .from("links")
          .update({ is_pinned: false })
          .eq("user_id", user.id)
          .in("id", ids!)
          .select();
        result = { data: { count: unpinResult.data?.length || ids!.length }, error: unpinResult.error };
        break;

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }

    if (result.error) {
      console.error(`Batch ${action} error:`, result.error);
      console.error('Error details:', {
        action,
        ids: ids || [],
        linksCount: links?.length || 0,
        errorCode: result.error.code,
        errorMessage: result.error.message,
        errorDetails: result.error.details,
        hint: result.error.hint,
      });
      return NextResponse.json(
        { 
          error: `Failed to ${action} links`,
          details: result.error.message,
        },
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

