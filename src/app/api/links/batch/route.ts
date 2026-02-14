import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canonicalizeUrl } from "@/lib/canonicalize";
import { enqueueBatchMetadataEnrichment, enqueueBatchAITagging } from "@/lib/job-queue";
import { MetadataService } from "@/features/links/services/metadata.service";
import { rateLimitLinks, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { validateRequestBody } from "@/lib/validation/validate";
import { batchActionSchema } from "@/lib/validation/link.schemas";
import { withRetry, supabaseRetryPredicate } from "@/lib/retry";

/**
 * Maximum number of items per batch operation
 * Prevents resource exhaustion and ensures reasonable response times
 */
const MAX_BATCH_SIZE = 100;

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

    // SECURITY: Enforce batch size limits to prevent resource exhaustion
    if (ids && ids.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { 
          error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} items`,
          maxBatchSize: MAX_BATCH_SIZE,
          requestedSize: ids.length
        },
        { status: 400 }
      );
    }
    
    if (links && links.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { 
          error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} items`,
          maxBatchSize: MAX_BATCH_SIZE,
          requestedSize: links.length
        },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "add":
        // Prepare links with clean_url for duplicate checking
        const linksToCheck = links!.map((link) => ({
          user_id: user.id,
          url: link.url,
          clean_url: link.content_type === "color" ? link.url : canonicalizeUrl(link.url),
          title: link.title || link.url,
          content_type: link.content_type || "url",
          favicon_url: link.favicon_url || null,
          color_value: (link as any).color_value || null,
          domain: link.content_type === "color" ? "color" : extractDomain(link.url),
          is_deleted: false,
          is_archived: false,
          is_pinned: false,
          fetch_status: "pending" as const,
        }));

        // Check for existing links (duplicates) - only check non-deleted links
        const cleanUrls = linksToCheck.map(l => l.clean_url);
        const { data: existingLinks } = await supabase
          .from("links")
          .select("clean_url")
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .in("clean_url", cleanUrls);

        const existingCleanUrls = new Set(existingLinks?.map(l => l.clean_url) || []);
        
        // Filter out duplicates
        const linksToInsert = linksToCheck.filter(l => !existingCleanUrls.has(l.clean_url));
        const duplicateCount = linksToCheck.length - linksToInsert.length;

        // Only insert non-duplicate links
        if (linksToInsert.length > 0) {
          const insertResult = await supabase
            .from("links")
            .insert(linksToInsert)
            .select();

          result = {
            data: {
              links: insertResult.data || [],
              count: insertResult.data?.length || 0,
              duplicates: duplicateCount,
              restored: 0,
            },
            error: insertResult.error,
          };
        } else {
          // All links were duplicates
          result = {
            data: {
              links: [],
              count: 0,
              duplicates: duplicateCount,
              restored: 0,
            },
            error: null,
          };
        }

        // Enqueue background metadata enrichment and AI tagging (fire-and-forget)
        if (!result.error && result.data?.links) {
          const urlLinks = (result.data.links as CreatedLink[]).filter(
            (link) => link.content_type === "url" || !link.content_type
          );

          if (urlLinks.length > 0) {
            // Enqueue metadata enrichment jobs
            const metadataJobs = urlLinks.map((link) => ({
              linkId: link.id,
              url: link.url,
              userId: user.id,
            }));

            // HYBRID APPROACH:
            // For small batches (typical user action), run metadata fetch synchronously/eagerly
            // to guarantee results without relying on external queues (QStash) which can be flaky.
            // For large batches, offload to background queue to prevent timeouts.
            if (urlLinks.length <= 5) {
              const metadataService = new MetadataService();
              
              // Run in parallel and wait for settled (don't block on one failure)
              // This ensures metadata is ready (or attempted) before request completes
              await Promise.allSettled(
                urlLinks.map(link => 
                  metadataService.enrichLink(link.id, link.url).catch(err => {
                    console.error(`[Batch] Metadata enrichment failed for ${link.url}:`, err);
                  })
                )
              );

              // CRITICAL Step for "Dev-Like" Experience:
              // Re-fetch the links we just enriched so we return the FULL metadata (Title, Description, etc.)
              // to the client immediately. This avoids the 5-second polling delay in the UI.
              const updatedIds = urlLinks.map(l => l.id);
              const { data: freshLinks } = await supabase
                .from("links")
                .select()
                .in("id", updatedIds);
              
              if (freshLinks && freshLinks.length > 0) {
                 const freshMap = new Map(freshLinks.map(l => [l.id, l]));
                 // Update the result object so the response contains the new data
                 // We use 'any' cast because result structure is inferred but flexible
                 if (result.data && Array.isArray(result.data.links)) {
                     result.data.links = result.data.links.map((l: any) => freshMap.get(l.id) || l);
                 }
              }
            } else {
              // Large batch: use background queue
              enqueueBatchMetadataEnrichment(metadataJobs).catch(err => {
                console.error("[Batch] Failed to enqueue metadata jobs:", err);
              });
            }

            // Enqueue AI tagging jobs
            const aiTagJobs = urlLinks.map((link) => ({
              linkId: link.id,
              userId: user.id,
            }));
            enqueueBatchAITagging(aiTagJobs).catch(() => {});
          }
        }
        break;

      case "delete":
        // Use retry for transient failures
        const deleteResult = await withRetry(
          async () => {
            const supabase = await createClient();
            return supabase
              .from("links")
              .update({ is_deleted: true, deleted_at: new Date().toISOString() })
              .eq("user_id", user.id)
              .in("id", ids!)
              .select();
          },
          { operationName: "batchDelete", shouldRetry: supabaseRetryPredicate }
        );
        // Report ACTUAL affected count, not the requested count
        result = {
          data: {
            count: deleteResult.data?.length || 0,
            requested: ids!.length,
          },
          error: deleteResult.error,
        };
        break;

      case "restore":
        const restoreResult = await withRetry(
          async () => {
            const supabase = await createClient();
            return supabase
              .from("links")
              .update({ is_deleted: false, is_archived: false, deleted_at: null })
              .eq("user_id", user.id)
              .in("id", ids!)
              .select();
          },
          { operationName: "batchRestore", shouldRetry: supabaseRetryPredicate }
        );
        result = {
          data: {
            count: restoreResult.data?.length || 0,
            requested: ids!.length,
          },
          error: restoreResult.error,
        };
        break;

      case "permanent_delete":
        const permDeleteResult = await withRetry(
          async () => {
            const supabase = await createClient();
            return supabase
              .from("links")
              .delete()
              .eq("user_id", user.id)
              .in("id", ids!)
              .select();
          },
          { operationName: "batchPermanentDelete", shouldRetry: supabaseRetryPredicate }
        );
        result = {
          data: {
            count: permDeleteResult.data?.length || 0,
            requested: ids!.length,
          },
          error: permDeleteResult.error,
        };
        break;

      case "pin":
        const pinResult = await withRetry(
          async () => {
            const supabase = await createClient();
            return supabase
              .from("links")
              .update({ is_pinned: true })
              .eq("user_id", user.id)
              .in("id", ids!)
              .select();
          },
          { operationName: "batchPin", shouldRetry: supabaseRetryPredicate }
        );
        result = {
          data: {
            count: pinResult.data?.length || 0,
            requested: ids!.length,
          },
          error: pinResult.error,
        };
        break;

      case "unpin":
        const unpinResult = await withRetry(
          async () => {
            const supabase = await createClient();
            return supabase
              .from("links")
              .update({ is_pinned: false })
              .eq("user_id", user.id)
              .in("id", ids!)
              .select();
          },
          { operationName: "batchUnpin", shouldRetry: supabaseRetryPredicate }
        );
        result = {
          data: {
            count: unpinResult.data?.length || 0,
            requested: ids!.length,
          },
          error: unpinResult.error,
        };
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

