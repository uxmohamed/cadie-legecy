import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canonicalizeUrl } from "@/lib/canonicalize";
import { enqueueBatchMetadataEnrichment, enqueueBatchAITagging, enqueueBatchAIVisionTagging } from "@/lib/job-queue";
import { MetadataService } from "@/features/links/services/metadata.service";
import { AITaggingService } from "@/features/links/services/ai-tagging.service";
import { rateLimitLinks, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { validateRequestBody } from "@/lib/validation/validate";
import { batchActionSchema } from "@/lib/validation/link.schemas";
import { withRetry, supabaseRetryPredicate } from "@/lib/retry";
import { resolveColorMetadata } from "@/lib/canonicalize";
import { AutoSpaceForwardingService } from "@/features/spaces/services/auto-space-forwarding.service";
import { getBillingContext } from "@/lib/billing/context";
import { createPlanLimitResponse } from "@/lib/billing/limit-response";

/**
 * Maximum number of items per batch operation
 * Prevents resource exhaustion and ensures reasonable response times
 */
const MAX_BATCH_SIZE = 100;
const EAGER_ENRICHMENT_LIMIT = 40;
const AI_ENRICHMENT_CONCURRENCY = 4;
const autoSpaceForwardingService = new AutoSpaceForwardingService();

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
  title?: string;
  content_type?: string;
  favicon_url?: string;
  description?: string;
  og_image_url?: string;
  domain?: string;
  site_name?: string | null;
  ai_tags?: string[] | null;
  content_text?: string | null;
}

interface LinkInsertPayload {
  user_id: string;
  url: string;
  clean_url: string;
  title: string;
  content_type: string;
  favicon_url: string | null;
  color_value: string | null;
  og_image_url: string | null;
  domain: string;
  is_deleted: boolean;
  is_archived: boolean;
  is_pinned: boolean;
  fetch_status: "success" | "pending";
  fetched_at: string | null;
  notes: string | null;
  content_text: string | null;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0) return;

  const queue = [...items];
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) return;
        await worker(next);
      }
    }
  );

  await Promise.all(workers);
}

async function refreshCreatedLinks(
  supabase: SupabaseServerClient,
  links: CreatedLink[]
): Promise<CreatedLink[]> {
  if (links.length === 0) return links;

  const ids = links.map((link) => link.id);
  const { data: freshLinks } = await supabase
    .from("links")
    .select("*")
    .in("id", ids);

  if (!freshLinks || freshLinks.length === 0) {
    return links;
  }

  const freshMap = new Map(freshLinks.map((link) => [link.id, link as CreatedLink]));
  return links.map((link) => freshMap.get(link.id) || link);
}

async function enrichUrlLinksWithAI(
  supabase: SupabaseServerClient,
  userId: string,
  links: CreatedLink[]
): Promise<string[]> {
  const taggingService = new AITaggingService();
  const failedIds = new Set<string>();

  await runWithConcurrency(links, AI_ENRICHMENT_CONCURRENCY, async (link) => {
    if (link.ai_tags && link.ai_tags.length > 0) {
      return;
    }

    try {
      const result = await taggingService.generateTags({
        title: link.title || link.url,
        description: link.description,
        domain: link.domain || extractDomain(link.url),
        site_name: link.site_name || null,
        url: link.url,
        content: link.content_text || null,
      });

      if (!result) {
        failedIds.add(link.id);
        return;
      }

      const { error } = await supabase
        .from("links")
        .update({
          ai_tags: result.tags,
          ai_key_themes: { category: result.category },
        })
        .eq("id", link.id)
        .eq("user_id", userId);

      if (error) {
        failedIds.add(link.id);
      }
    } catch {
      failedIds.add(link.id);
    }
  });

  return [...failedIds];
}

async function insertLinksWithFallback(
  supabase: SupabaseServerClient,
  linksToInsert: LinkInsertPayload[]
) {
  const initialInsert = await supabase
    .from("links")
    .insert(linksToInsert)
    .select();

  // Backward compatibility: older deployments might not have content_text yet.
  if (
    initialInsert.error?.code === "PGRST204" &&
    initialInsert.error.message?.includes("content_text")
  ) {
    const withoutContentText = linksToInsert.map((link) => {
      const copy = { ...link } as Partial<LinkInsertPayload>;
      delete copy.content_text;
      return copy;
    });
    return supabase
      .from("links")
      .insert(withoutContentText)
      .select();
  }

  return initialInsert;
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

    const callbackBaseUrl = request.nextUrl.origin;

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
      case "add": {
        // Enforce plan limits before inserting
        const billingCtx = await getBillingContext(user.id);
        const { entitlements, usage } = billingCtx;

        if (entitlements.maxSavedItems !== null && usage.totalSavedItems >= entitlements.maxSavedItems) {
          return createPlanLimitResponse({
            plan: billingCtx.plan,
            limitKey: "saved_items",
            current: usage.totalSavedItems,
            max: entitlements.maxSavedItems,
            message: `You've reached the ${entitlements.maxSavedItems}-item limit on the ${billingCtx.plan} plan. Upgrade to save more.`,
          });
        }

        // Cap batch size to remaining item allowance
        const remainingItems = entitlements.maxSavedItems !== null
          ? entitlements.maxSavedItems - usage.totalSavedItems
          : Infinity;

        const incomingLinks = links!;
        const cappedLinks = remainingItems < incomingLinks.length
          ? incomingLinks.slice(0, remainingItems)
          : incomingLinks;

        // Check image/document media caps
        if (entitlements.maxImages !== null) {
          const incomingImageCount = cappedLinks.filter((l) => l.content_type === "image").length;
          if (incomingImageCount > 0 && usage.imagesTotal + incomingImageCount > entitlements.maxImages) {
            return createPlanLimitResponse({
              plan: billingCtx.plan,
              limitKey: "images",
              current: usage.imagesTotal,
              max: entitlements.maxImages,
              message: `Image limit reached on the ${billingCtx.plan} plan. Upgrade for more image uploads.`,
            });
          }
        }

        if (entitlements.maxDocuments !== null) {
          const incomingDocCount = cappedLinks.filter((l) => l.content_type === "document").length;
          if (incomingDocCount > 0 && usage.documentsTotal + incomingDocCount > entitlements.maxDocuments) {
            return createPlanLimitResponse({
              plan: billingCtx.plan,
              limitKey: "documents",
              current: usage.documentsTotal,
              max: entitlements.maxDocuments,
              message: `Document limit reached on the ${billingCtx.plan} plan. Upgrade for more document uploads.`,
            });
          }
        }

        // Prepare links with clean_url for duplicate checking
        const linksToCheck = cappedLinks.map((link) => {
          const ct = link.content_type || "url";
          const isImage = ct === "image";
          const isColor = ct === "color";
          const isDocument = ct === "document";
          const isNote = ct === "note";
          const colorMetadata = isColor
            ? resolveColorMetadata(link.color_value || link.url)
            : null;
          const normalizedColorCode = colorMetadata?.colorCode || (link.color_value || link.url);
          const normalizedColorName = colorMetadata?.colorName || link.title || "Custom Color";
          const normalizedUrl = isColor ? normalizedColorCode : link.url;
          return {
            user_id: user.id,
            url: normalizedUrl,
            clean_url: isColor || isImage || isDocument || isNote ? normalizedUrl : canonicalizeUrl(link.url),
            title: isColor ? normalizedColorName : (link.title || link.url),
            content_type: ct,
            favicon_url: link.favicon_url || null,
            color_value: isColor ? normalizedColorCode : (link.color_value || null),
            og_image_url: isImage ? link.url : null,
            domain: isColor ? "color" : isImage ? "image" : isDocument ? "document" : extractDomain(link.url),
            is_deleted: false,
            is_archived: false,
            is_pinned: false,
            fetch_status: isColor || isNote ? "success" as const : "pending" as const,
            fetched_at: isColor || isNote ? new Date().toISOString() : null,
            notes: link.notes || null,
            content_text: link.content_text || null,
          };
        });

        // Collapse duplicates inside the same request payload before touching DB.
        const uniqueLinksToCheck = Array.from(
          new Map(linksToCheck.map((link) => [link.clean_url, link])).values()
        );
        const payloadDuplicateCount = linksToCheck.length - uniqueLinksToCheck.length;

        // Check for existing links (duplicates) - only check non-deleted links
        const cleanUrls = uniqueLinksToCheck.map(l => l.clean_url);
        const { data: existingLinks } = await supabase
          .from("links")
          .select("clean_url")
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .in("clean_url", cleanUrls);

        const existingCleanUrls = new Set(existingLinks?.map(l => l.clean_url) || []);
        
        // Filter out duplicates
        const linksToInsert = uniqueLinksToCheck.filter(l => !existingCleanUrls.has(l.clean_url));
        const duplicateCount = payloadDuplicateCount + (uniqueLinksToCheck.length - linksToInsert.length);

        // Only insert non-duplicate links
        if (linksToInsert.length > 0) {
          const insertResult = await insertLinksWithFallback(supabase, linksToInsert);

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

        if (!result.error && result.data?.links) {
          let createdLinks = result.data.links as CreatedLink[];
          const urlLinks = createdLinks.filter(
            (link) => link.content_type === "url" || !link.content_type
          );

          if (urlLinks.length > 0) {
            const metadataJobs = urlLinks.map((link) => ({
              linkId: link.id,
              url: link.url,
              userId: user.id,
            }));

            if (urlLinks.length <= EAGER_ENRICHMENT_LIMIT) {
              const metadataService = new MetadataService();
              await Promise.allSettled(
                urlLinks.map(link => 
                  metadataService.enrichLink(link.id, link.url).catch(err => {
                    console.error(`[Batch] Metadata enrichment failed for ${link.url}:`, err);
                  })
                )
              );

              const linksAfterMetadata = await refreshCreatedLinks(
                supabase,
                createdLinks
              );
              createdLinks = linksAfterMetadata;

              const refreshedUrlLinks = linksAfterMetadata.filter(
                (link) => link.content_type === "url" || !link.content_type
              );
              const failedAiIds = await enrichUrlLinksWithAI(
                supabase,
                user.id,
                refreshedUrlLinks
              );

              if (failedAiIds.length > 0) {
                const fallbackTagJobs = failedAiIds.map((linkId) => ({
                  linkId,
                  userId: user.id,
                }));
                enqueueBatchAITagging(fallbackTagJobs, { baseUrl: callbackBaseUrl }).catch(() => {});
              }

              const linksAfterUrlAI = await refreshCreatedLinks(
                supabase,
                linksAfterMetadata
              );
              createdLinks = linksAfterUrlAI;
            } else {
              enqueueBatchMetadataEnrichment(metadataJobs, { baseUrl: callbackBaseUrl }).catch(err => {
                console.error("[Batch] Failed to enqueue metadata jobs:", err);
              });
              const aiTagJobs = urlLinks.map((link) => ({
                linkId: link.id,
                userId: user.id,
              }));
              enqueueBatchAITagging(aiTagJobs, { baseUrl: callbackBaseUrl }).catch(() => {});
            }
          }

          const imageLinks = createdLinks.filter(
            (link) => link.content_type === "image"
          );

          if (imageLinks.length > 0) {
            const visionJobs = imageLinks.map((link) => ({
              linkId: link.id,
              userId: user.id,
            }));
            enqueueBatchAIVisionTagging(visionJobs, { baseUrl: callbackBaseUrl }).catch(() => {});
          }

          const documentLinks = createdLinks.filter(
            (link) => link.content_type === "document"
          );

          if (documentLinks.length > 0) {
            const docTagJobs = documentLinks.map((link) => ({
              linkId: link.id,
              userId: user.id,
            }));
            enqueueBatchAITagging(docTagJobs, { baseUrl: callbackBaseUrl }).catch(() => {});
          }

          result.data.links = createdLinks;

          const forwardingResult = await autoSpaceForwardingService.forwardLinks(
            user.id,
            createdLinks
          );

          (result.data as Record<string, unknown>).auto_forwarded_spaces = forwardingResult.forwardedSpaceNames;
          (result.data as Record<string, unknown>).auto_forwarded_by_link_id = forwardingResult.forwardedByLinkId;
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
