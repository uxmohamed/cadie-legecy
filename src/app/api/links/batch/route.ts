import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canonicalizeUrl } from "@/lib/canonicalize";
import { enqueueBatchMetadataEnrichment, enqueueBatchAITagging, enqueueBatchAIVisionTagging } from "@/lib/job-queue";
import { rateLimitLinks, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { validateRequestBody } from "@/lib/validation/validate";
import { batchActionSchema } from "@/lib/validation/link.schemas";
import { withRetry, supabaseRetryPredicate } from "@/lib/retry";
import { resolveColorMetadata } from "@/lib/canonicalize";
import { AutoSpaceForwardingService } from "@/features/spaces/services/auto-space-forwarding.service";
import { getBillingContext } from "@/lib/billing/context";
import { createPlanLimitResponse } from "@/lib/billing/limit-response";
import { log } from "@/lib/logger";
import {
  getInitialLinkProcessingStage,
  getInitialLinkProcessingState,
  updateLinkProcessingState,
} from "@/features/links/lib/link-processing";

/**
 * Maximum number of items per batch operation
 * Prevents resource exhaustion and ensures reasonable response times
 */
const MAX_BATCH_SIZE = 100;
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
  processing_state: string;
  processing_stage: string;
  processing_error: string | null;
  notes: string | null;
  content_text: string | null;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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
  const requestStartedAt = Date.now();
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
        const addStartedAt = Date.now();
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
            processing_state: getInitialLinkProcessingState(ct),
            processing_stage: getInitialLinkProcessingStage(ct),
            processing_error: null,
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
          const createdLinks = (result.data.links as CreatedLink[]) || [];
          const shouldQueueProcessing = createdLinks.length > 0;

          (result.data as Record<string, unknown>).processing_state = shouldQueueProcessing ? "queued" : "completed";
          (result.data as Record<string, unknown>).auto_forwarded_spaces = [];
          (result.data as Record<string, unknown>).auto_forwarded_by_link_id = {};

          if (shouldQueueProcessing) {
            after(async () => {
              const asyncStartedAt = Date.now();
              const urlLinks = createdLinks.filter(
                (link) => link.content_type === "url" || !link.content_type
              );
              const imageLinks = createdLinks.filter((link) => link.content_type === "image");
              const documentLinks = createdLinks.filter((link) => link.content_type === "document");

              await Promise.allSettled(
                createdLinks.map((link) =>
                  updateLinkProcessingState(supabase, {
                    linkId: link.id,
                    userId: user.id,
                    state: "processing",
                    stage: "forwarding",
                  })
                )
              );

              if (urlLinks.length > 0) {
                const metadataJobs = urlLinks.map((link) => ({
                  linkId: link.id,
                  url: link.url,
                  userId: user.id,
                }));
                const aiTagJobs = urlLinks.map((link) => ({
                  linkId: link.id,
                  userId: user.id,
                }));

                enqueueBatchMetadataEnrichment(metadataJobs, { baseUrl: callbackBaseUrl }).catch(async () => {
                  await Promise.allSettled(
                    urlLinks.map((link) =>
                      updateLinkProcessingState(supabase, {
                        linkId: link.id,
                        userId: user.id,
                        state: "failed",
                        stage: "enrichment_queue",
                        error: "We saved the item, but couldn't start background enrichment.",
                      })
                    )
                  );
                });
                enqueueBatchAITagging(aiTagJobs, { baseUrl: callbackBaseUrl }).catch(async () => {
                  await Promise.allSettled(
                    urlLinks.map((link) =>
                      updateLinkProcessingState(supabase, {
                        linkId: link.id,
                        userId: user.id,
                        state: "failed",
                        stage: "enrichment_queue",
                        error: "We saved the item, but couldn't start background enrichment.",
                      })
                    )
                  );
                });
              }

              if (imageLinks.length > 0) {
                const visionJobs = imageLinks.map((link) => ({
                  linkId: link.id,
                  userId: user.id,
                }));
                enqueueBatchAIVisionTagging(visionJobs, { baseUrl: callbackBaseUrl }).catch(async () => {
                  await Promise.allSettled(
                    imageLinks.map((link) =>
                      updateLinkProcessingState(supabase, {
                        linkId: link.id,
                        userId: user.id,
                        state: "failed",
                        stage: "enrichment_queue",
                        error: "We saved the item, but couldn't start background enrichment.",
                      })
                    )
                  );
                });
              }

              if (documentLinks.length > 0) {
                const docTagJobs = documentLinks.map((link) => ({
                  linkId: link.id,
                  userId: user.id,
                }));
                enqueueBatchAITagging(docTagJobs, { baseUrl: callbackBaseUrl }).catch(async () => {
                  await Promise.allSettled(
                    documentLinks.map((link) =>
                      updateLinkProcessingState(supabase, {
                        linkId: link.id,
                        userId: user.id,
                        state: "failed",
                        stage: "enrichment_queue",
                        error: "We saved the item, but couldn't start background enrichment.",
                      })
                    )
                  );
                });
              }

              await Promise.allSettled(
                createdLinks
                  .filter((link) => link.content_type === "url" || link.content_type === "image" || link.content_type === "document" || !link.content_type)
                  .map((link) =>
                    updateLinkProcessingState(supabase, {
                      linkId: link.id,
                      userId: user.id,
                      state: "processing",
                      stage: link.content_type === "image" ? "ai_vision_tagging" : "metadata",
                    })
                  )
              );

              try {
                await autoSpaceForwardingService.forwardLinks(user.id, createdLinks);
              } catch (error) {
                await Promise.allSettled(
                  createdLinks.map((link) =>
                    updateLinkProcessingState(supabase, {
                      linkId: link.id,
                      userId: user.id,
                      state: "failed",
                      stage: "forwarding",
                      error: "Auto-forwarding failed after save.",
                    })
                  )
                );
                log.warn("[BatchAddAsync] Auto-forwarding failed", {
                  userId: user.id,
                  error: error instanceof Error ? error.message : String(error),
                });
              }

              log.info("[BatchAddAsyncPerf]", {
                userId: user.id,
                createdLinks: createdLinks.length,
                totalAsyncMs: Date.now() - asyncStartedAt,
              });
            });
          }

          log.info("[BatchAddPerf]", {
            userId: user.id,
            requested: links?.length ?? 0,
            created: (result.data.links as CreatedLink[]).length,
            duplicates: (result.data as { duplicates?: number }).duplicates ?? 0,
            totalMs: Date.now() - addStartedAt,
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

      case "restore": {
        // Enforce plan limit: restoring soft-deleted items counts toward the cap
        const restoreBillingCtx = await getBillingContext(user.id);
        const { entitlements: restoreEnt, usage: restoreUsage } = restoreBillingCtx;
        if (restoreEnt.maxSavedItems !== null && restoreUsage.totalSavedItems + ids!.length > restoreEnt.maxSavedItems) {
          return createPlanLimitResponse({
            plan: restoreBillingCtx.plan,
            limitKey: "saved_items",
            current: restoreUsage.totalSavedItems,
            max: restoreEnt.maxSavedItems,
            message: `You've reached the ${restoreEnt.maxSavedItems}-item limit on the ${restoreBillingCtx.plan} plan. Upgrade to restore more items.`,
          });
        }
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
      }

      case "permanent_delete":
        const permDeleteResult = await withRetry(
          async () => {
            const supabase = await createClient();
            return supabase
              .from("links")
              .delete()
              .eq("user_id", user.id)
              .eq("is_deleted", true)
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
    log.warn("[BatchRoutePerf] Request failed", {
      totalMs: Date.now() - requestStartedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
