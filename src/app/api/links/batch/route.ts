import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canonicalizeUrl, resolveColorMetadata } from "@/lib/canonicalize";
import {
  enqueueBatchMetadataEnrichment,
  enqueueBatchAITagging,
  enqueueBatchAIVisionTagging,
  isJobQueueConfigured,
} from "@/lib/job-queue";
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

interface CreatedLink {
  id: string;
  url: string;
  content_type?: string;
}

interface LinkInsertPayload {
  user_id: string;
  url: string;
  clean_url: string;
  title: string;
  content_type: "url" | "color" | "image";
  favicon_url: string | null;
  color_value: string | null;
  og_image_url: string | null;
  domain: string;
  is_deleted: boolean;
  is_archived: boolean;
  is_pinned: boolean;
  fetch_status: "pending" | "success";
  fetched_at: string | null;
}

function normalizeLinkForInsert(
  userId: string,
  link: {
    url: string;
    title?: string;
    content_type?: "url" | "color" | "image";
    color_value?: string | null;
    favicon_url?: string | null;
    og_image_url?: string | null;
  }
): LinkInsertPayload {
  const contentType = link.content_type || "url";
  const isColor = contentType === "color";
  const isImage = contentType === "image";
  const colorMetadata = isColor
    ? resolveColorMetadata(link.color_value || link.url)
    : null;
  const normalizedColorCode = colorMetadata?.colorCode || (link.color_value || link.url);
  const normalizedColorName = colorMetadata?.colorName || link.title || "Custom Color";
  const normalizedUrl = isColor ? normalizedColorCode : link.url;

  return {
    user_id: userId,
    url: normalizedUrl,
    clean_url: isColor || isImage ? normalizedUrl : canonicalizeUrl(link.url),
    title: isColor ? normalizedColorName : (link.title || link.url),
    content_type: contentType,
    favicon_url: link.favicon_url || null,
    color_value: isColor ? normalizedColorCode : (link.color_value || null),
    og_image_url: isImage ? (link.og_image_url || link.url) : null,
    domain: isColor ? "color" : isImage ? "image" : extractDomain(link.url),
    is_deleted: false,
    is_archived: false,
    is_pinned: false,
    fetch_status: isColor ? "success" : "pending",
    fetched_at: isColor ? new Date().toISOString() : null,
  };
}

async function scheduleEnrichment(
  userId: string,
  links: CreatedLink[]
): Promise<void> {
  if (links.length === 0) return;

  const urlLinks = links.filter((link) => link.content_type === "url" || !link.content_type);
  const imageLinks = links.filter((link) => link.content_type === "image");
  const hasQueue = isJobQueueConfigured();

  if (hasQueue && urlLinks.length > 0) {
    const metadataJobs = urlLinks.map((link) => ({
      linkId: link.id,
      url: link.url,
      userId,
    }));
    const aiTagJobs = urlLinks.map((link) => ({
      linkId: link.id,
      userId,
    }));

    await Promise.allSettled([
      enqueueBatchMetadataEnrichment(metadataJobs),
      enqueueBatchAITagging(aiTagJobs),
    ]);
  }

  // Local/dev fallback when queue is unavailable.
  if (!hasQueue && urlLinks.length > 0) {
    const metadataService = new MetadataService();
    await Promise.allSettled(
      urlLinks.map((link) => metadataService.enrichLink(link.id, link.url, link.content_type))
    );
  }

  if (hasQueue && imageLinks.length > 0) {
    const visionJobs = imageLinks.map((link) => ({
      linkId: link.id,
      userId,
    }));
    await enqueueBatchAIVisionTagging(visionJobs);
  }
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
          headers: getRateLimitHeaders(limit, remaining, reset),
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
          requestedSize: ids.length,
        },
        { status: 400 }
      );
    }

    if (links && links.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} items`,
          maxBatchSize: MAX_BATCH_SIZE,
          requestedSize: links.length,
        },
        { status: 400 }
      );
    }

    let result: { data: Record<string, unknown>; error: { message?: string; code?: string; details?: string; hint?: string } | null };

    switch (action) {
      case "add": {
        const normalizedLinks = links!.map((link) => normalizeLinkForInsert(user.id, link));

        // De-duplicate within request payload by clean_url.
        const seenCleanUrls = new Set<string>();
        const uniqueLinks: LinkInsertPayload[] = [];
        let duplicateCount = 0;

        normalizedLinks.forEach((link) => {
          if (seenCleanUrls.has(link.clean_url)) {
            duplicateCount++;
            return;
          }
          seenCleanUrls.add(link.clean_url);
          uniqueLinks.push(link);
        });

        if (uniqueLinks.length === 0) {
          result = {
            data: {
              links: [],
              count: 0,
              duplicates: duplicateCount,
              restored: 0,
            },
            error: null,
          };
          break;
        }

        const cleanUrls = uniqueLinks.map((link) => link.clean_url);
        const { data: existingLinks, error: existingError } = await supabase
          .from("links")
          .select("id, clean_url, is_deleted, is_archived")
          .eq("user_id", user.id)
          .in("clean_url", cleanUrls);

        if (existingError) {
          result = { data: {}, error: existingError };
          break;
        }

        const existingByCleanUrl = new Map(
          (existingLinks || []).map((link) => [link.clean_url as string, link as {
            id: string;
            clean_url: string;
            is_deleted: boolean;
            is_archived: boolean;
          }])
        );

        const linksToInsert: LinkInsertPayload[] = [];
        const linksToRestore: string[] = [];

        uniqueLinks.forEach((link) => {
          const existing = existingByCleanUrl.get(link.clean_url);
          if (!existing) {
            linksToInsert.push(link);
            return;
          }

          if (existing.is_deleted || existing.is_archived) {
            linksToRestore.push(existing.id);
            return;
          }

          duplicateCount++;
        });

        let restoredLinks: CreatedLink[] = [];
        if (linksToRestore.length > 0) {
          const restoreResult = await supabase
            .from("links")
            .update({ is_deleted: false, is_archived: false, deleted_at: null })
            .eq("user_id", user.id)
            .in("id", linksToRestore)
            .select();

          if (restoreResult.error) {
            result = { data: {}, error: restoreResult.error };
            break;
          }
          restoredLinks = (restoreResult.data || []) as CreatedLink[];
        }

        let insertedLinks: CreatedLink[] = [];
        if (linksToInsert.length > 0) {
          const insertResult = await supabase
            .from("links")
            .insert(linksToInsert)
            .select();

          if (insertResult.error) {
            result = { data: {}, error: insertResult.error };
            break;
          }
          insertedLinks = (insertResult.data || []) as CreatedLink[];
        }

        const createdLinks = [...restoredLinks, ...insertedLinks];
        const restoredCount = restoredLinks.length;

        result = {
          data: {
            links: createdLinks,
            count: createdLinks.length,
            duplicates: duplicateCount,
            restored: restoredCount,
          },
          error: null,
        };

        if (createdLinks.length > 0) {
          after(async () => {
            try {
              await scheduleEnrichment(user.id, createdLinks);
            } catch (error) {
              console.error("[Batch] Failed to schedule enrichment:", error);
            }
          });
        }
        break;
      }

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
      console.error("Error details:", {
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
