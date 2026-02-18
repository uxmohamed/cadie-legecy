import { NextRequest, NextResponse, after } from "next/server";
import { LinkService } from "@/features/links/services";
import { AITaggingService } from "@/features/links/services/ai-tagging.service";
import { SupabaseLinkRepository } from "@/features/links/repositories";
import { authenticateRequest } from "@/lib/auth-middleware";
import type { CreateLinkDTO } from "@/features/links/types";
import { toAppError, ErrorCode, AppError } from "@/lib/errors";
import { resolveColorMetadata } from "@/lib/canonicalize";
import { enqueueMetadataEnrichment, enqueueAITagging, enqueueAIVisionTagging } from "@/lib/job-queue";
import { AutoSpaceForwardingService } from "@/features/spaces/services/auto-space-forwarding.service";
import { createAdminClient } from "@/lib/supabase/server";
import { extractMetadata } from "@/lib/metadata";
import { log } from "@/lib/logger";
import { getBillingContext } from "@/lib/billing/context";
import { createPlanLimitResponse } from "@/lib/billing/limit-response";

const EXTENSION_SOURCE_HEADER = "x-cadie-source";
const EXTENSION_SOURCE_VALUE = "extension";
const EXTENSION_FALLBACK_DELAY_MS = 12_000;
const RECOVERY_SELECT_FIELDS = [
    "id",
    "user_id",
    "url",
    "title",
    "description",
    "domain",
    "site_name",
    "content_text",
    "content_type",
    "og_image_url",
    "ai_tags",
    "fetch_status",
].join(", ");

type RecoveryOutcome = "success" | "failed" | "skipped";
type RecoveryStage = "precheck" | "metadata" | "ai" | "finalize";
type AdminClient = ReturnType<typeof createAdminClient>;

interface RecoveryLink {
    id: string;
    user_id: string;
    url: string;
    title: string | null;
    description: string | null;
    domain: string | null;
    site_name: string | null;
    content_text: string | null;
    content_type: string | null;
    og_image_url: string | null;
    ai_tags: string[] | null;
    fetch_status: string | null;
}

/**
 * Handler for POST /api/links
 * Creates a new link for the authenticated user
 */
export class CreateLinkHandler {
    private linkService: LinkService;
    private autoForwardingService: AutoSpaceForwardingService;

    constructor() {
        const repository = new SupabaseLinkRepository();
        this.linkService = new LinkService(repository);
        this.autoForwardingService = new AutoSpaceForwardingService();
    }

    private async validateLink(url: string, title: string): Promise<void> {
        // 1. Basic URL validation
        try {
            new URL(url);
        } catch {
            throw new AppError(
                ErrorCode.INVALID_INPUT,
                "Invalid URL format",
                400
            );
        }

        // 2. Blocked content check (Basic list)
        const blockedTerms = ["porn", "xxx", "gambling", "casino", "sex", "adult"];
        const lowerUrl = url.toLowerCase();
        const lowerTitle = title.toLowerCase();

        const hasBlockedTerm = blockedTerms.some(term =>
            lowerUrl.includes(term) || lowerTitle.includes(term)
        );

        if (hasBlockedTerm) {
            throw new AppError(
                ErrorCode.INVALID_INPUT,
                "Link contains blocked content",
                400
            );
        }

        // Note: We no longer do reachability checks here.
        // The metadata enrichment job will handle this asynchronously.
        // This keeps saves fast and avoids false negatives from sites that block HEAD requests.
    }

    /**
     * Extract domain from URL to use as placeholder title
     */
    private extractDomainFromUrl(url: string): string {
        try {
            return new URL(url).hostname.replace(/^www\./, "");
        } catch {
            return url;
        }
    }

    private isExtensionSource(request: NextRequest): boolean {
        return request.headers.get(EXTENSION_SOURCE_HEADER)?.toLowerCase() === EXTENSION_SOURCE_VALUE;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private isAiMissing(link: Pick<RecoveryLink, "ai_tags">): boolean {
        return !Array.isArray(link.ai_tags) || link.ai_tags.length === 0;
    }

    private isFetchStillLoading(status: string | null): boolean {
        return status === "pending" || status === "fetching";
    }

    private shouldRunRecovery(link: RecoveryLink): boolean {
        const contentType = link.content_type || "url";

        if (contentType === "url") {
            return this.isFetchStillLoading(link.fetch_status) || this.isAiMissing(link);
        }

        if (contentType === "document" || contentType === "image") {
            return this.isAiMissing(link);
        }

        return false;
    }

    private logRecovery(
        linkId: string,
        stage: RecoveryStage,
        outcome: RecoveryOutcome,
        extras?: Record<string, unknown>
    ): void {
        log.info("[ExtensionRecovery]", {
            source: EXTENSION_SOURCE_VALUE,
            linkId,
            stage,
            outcome,
            ...extras,
        });
    }

    private deriveDocumentLabel(title: string | null, url: string): string {
        if (title && title.trim().length > 0) return title.trim();

        try {
            const parsed = new URL(url);
            const file = decodeURIComponent(parsed.pathname.split("/").pop() || "");
            const stripped = file.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim();
            return stripped || "PDF document";
        } catch {
            return "PDF document";
        }
    }

    private normalizeDocTitle(raw: string): string {
        return raw
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 8)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ") || "PDF Document";
    }

    private async loadRecoveryLink(
        supabase: AdminClient,
        linkId: string,
        userId: string
    ): Promise<RecoveryLink | null> {
        const { data, error } = await supabase
            .from("links")
            .select(RECOVERY_SELECT_FIELDS)
            .eq("id", linkId)
            .eq("user_id", userId)
            .maybeSingle();

        if (error) {
            this.logRecovery(linkId, "precheck", "failed", { reason: "load_failed", error: error.message });
            return null;
        }

        return (data as RecoveryLink | null) ?? null;
    }

    private async recoverUrlMetadata(
        supabase: AdminClient,
        link: RecoveryLink
    ): Promise<{ outcome: RecoveryOutcome; link: RecoveryLink }> {
        if (!this.isFetchStillLoading(link.fetch_status)) {
            this.logRecovery(link.id, "metadata", "skipped", { reason: "fetch_already_resolved", fetchStatus: link.fetch_status });
            return { outcome: "skipped", link };
        }

        try {
            const metadata = await extractMetadata(link.url);
            const hasGenericTitle = !link.title || link.title === link.url || (link.domain ? link.title === link.domain : false);
            const updates: Record<string, unknown> = {
                fetch_status: metadata.fetch_status,
                fetched_at: metadata.fetched_at,
            };

            if (hasGenericTitle && metadata.title && metadata.title !== metadata.domain) {
                updates.title = metadata.title;
            }
            if (!link.description && metadata.description) {
                updates.description = metadata.description;
            }
            if (!link.og_image_url && metadata.preview_image_url) {
                updates.og_image_url = metadata.preview_image_url;
            }
            if (metadata.site_name) {
                updates.site_name = metadata.site_name;
            }
            if (metadata.final_url) {
                updates.final_url = metadata.final_url;
            }
            if (metadata.canonical_url) {
                updates.canonical_url = metadata.canonical_url;
            }
            if (metadata.content_text) {
                updates.content_text = metadata.content_text;
            }
            if (metadata.favicon_url) {
                updates.favicon_url = metadata.favicon_url;
            }

            const { error } = await supabase
                .from("links")
                .update(updates)
                .eq("id", link.id)
                .eq("user_id", link.user_id);

            if (error) {
                this.logRecovery(link.id, "metadata", "failed", { reason: "update_failed", error: error.message });
                return { outcome: "failed", link };
            }

            const refreshedLink = await this.loadRecoveryLink(supabase, link.id, link.user_id);
            this.logRecovery(link.id, "metadata", "success", { fetchStatus: metadata.fetch_status });
            return { outcome: "success", link: refreshedLink ?? link };
        } catch (error) {
            this.logRecovery(link.id, "metadata", "failed", {
                reason: "extract_failed",
                error: error instanceof Error ? error.message : String(error),
            });
            return { outcome: "failed", link };
        }
    }

    private async recoverUrlOrDocumentAI(
        supabase: AdminClient,
        link: RecoveryLink
    ): Promise<{ outcome: RecoveryOutcome; link: RecoveryLink }> {
        if (!this.isAiMissing(link)) {
            this.logRecovery(link.id, "ai", "skipped", { reason: "already_tagged" });
            return { outcome: "skipped", link };
        }

        const isDocument = link.content_type === "document";

        try {
            const taggingService = new AITaggingService();
            const documentLabel = isDocument ? this.deriveDocumentLabel(link.title, link.url) : null;
            const result = await taggingService.generateTags({
                title: isDocument ? documentLabel : (link.title || link.url),
                description: isDocument
                    ? (link.description || "PDF document. Fast skim mode: metadata only, no deep content analysis.")
                    : link.description,
                domain: link.domain,
                site_name: link.site_name,
                url: link.url,
                content: isDocument ? null : link.content_text,
            });

            if (!result) {
                this.logRecovery(link.id, "ai", "failed", { reason: "no_tags_returned", contentType: link.content_type || "url" });
                return { outcome: "failed", link };
            }

            const updates: Record<string, unknown> = {
                ai_tags: result.tags,
                ai_key_themes: { category: result.category },
            };

            if (isDocument) {
                const normalizedTitle = this.normalizeDocTitle(documentLabel || link.title || "PDF document");
                const hasGenericTitle = !link.title || link.title === link.url || link.title.toLowerCase() === "pdf document";
                if (hasGenericTitle) {
                    updates.title = normalizedTitle;
                }
                if (!link.description || link.description.trim().length === 0) {
                    updates.description = `PDF file saved as ${normalizedTitle}. Auto-tagged from filename and URL using low-token skim mode.`;
                }
                updates.fetch_status = "success";
                updates.fetched_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from("links")
                .update(updates)
                .eq("id", link.id)
                .eq("user_id", link.user_id);

            if (error) {
                this.logRecovery(link.id, "ai", "failed", { reason: "update_failed", error: error.message, contentType: link.content_type || "url" });
                return { outcome: "failed", link };
            }

            const refreshedLink = await this.loadRecoveryLink(supabase, link.id, link.user_id);
            this.logRecovery(link.id, "ai", "success", { contentType: link.content_type || "url", tagsCount: result.tags.length });
            return { outcome: "success", link: refreshedLink ?? link };
        } catch (error) {
            this.logRecovery(link.id, "ai", "failed", {
                reason: "generate_failed",
                contentType: link.content_type || "url",
                error: error instanceof Error ? error.message : String(error),
            });
            return { outcome: "failed", link };
        }
    }

    private async recoverImageAI(
        supabase: AdminClient,
        link: RecoveryLink
    ): Promise<{ outcome: RecoveryOutcome; link: RecoveryLink }> {
        if (!this.isAiMissing(link)) {
            this.logRecovery(link.id, "ai", "skipped", { reason: "already_tagged", contentType: "image" });
            return { outcome: "skipped", link };
        }

        try {
            const taggingService = new AITaggingService();
            const result = await taggingService.generateTagsFromImage(link.og_image_url || link.url);

            if (!result) {
                this.logRecovery(link.id, "ai", "failed", { reason: "no_tags_returned", contentType: "image" });
                return { outcome: "failed", link };
            }

            const updates: Record<string, unknown> = {
                ai_tags: result.tags,
                ai_key_themes: { category: result.category },
                fetch_status: "success",
                fetched_at: new Date().toISOString(),
            };

            if (result.description) {
                updates.description = result.description;
            }
            if (result.title) {
                updates.title = result.title;
            } else if (result.description) {
                updates.title = result.description.split(/\s+/).slice(0, 5).join(" ");
            }

            const { error } = await supabase
                .from("links")
                .update(updates)
                .eq("id", link.id)
                .eq("user_id", link.user_id);

            if (error) {
                this.logRecovery(link.id, "ai", "failed", { reason: "update_failed", error: error.message, contentType: "image" });
                return { outcome: "failed", link };
            }

            const refreshedLink = await this.loadRecoveryLink(supabase, link.id, link.user_id);
            this.logRecovery(link.id, "ai", "success", { contentType: "image", tagsCount: result.tags.length });
            return { outcome: "success", link: refreshedLink ?? link };
        } catch (error) {
            this.logRecovery(link.id, "ai", "failed", {
                reason: "generate_failed",
                contentType: "image",
                error: error instanceof Error ? error.message : String(error),
            });
            return { outcome: "failed", link };
        }
    }

    private async runExtensionRecovery(linkId: string, userId: string): Promise<void> {
        await this.sleep(EXTENSION_FALLBACK_DELAY_MS);

        let supabase: AdminClient;
        try {
            supabase = createAdminClient();
        } catch (error) {
            this.logRecovery(linkId, "precheck", "failed", {
                reason: "admin_client_unavailable",
                error: error instanceof Error ? error.message : String(error),
            });
            return;
        }

        let link = await this.loadRecoveryLink(supabase, linkId, userId);
        if (!link) {
            this.logRecovery(linkId, "precheck", "skipped", { reason: "link_not_found" });
            return;
        }

        if (!this.shouldRunRecovery(link)) {
            this.logRecovery(linkId, "precheck", "skipped", {
                reason: "already_resolved",
                fetchStatus: link.fetch_status,
                hasTags: !this.isAiMissing(link),
                contentType: link.content_type || "url",
            });
            return;
        }

        const contentType = link.content_type || "url";
        let hadFailedStage = false;

        if (contentType === "url") {
            const metadataResult = await this.recoverUrlMetadata(supabase, link);
            link = metadataResult.link;
            hadFailedStage ||= metadataResult.outcome === "failed";

            const aiResult = await this.recoverUrlOrDocumentAI(supabase, link);
            link = aiResult.link;
            hadFailedStage ||= aiResult.outcome === "failed";
        } else if (contentType === "document") {
            const aiResult = await this.recoverUrlOrDocumentAI(supabase, link);
            link = aiResult.link;
            hadFailedStage ||= aiResult.outcome === "failed";
        } else if (contentType === "image") {
            const aiResult = await this.recoverImageAI(supabase, link);
            link = aiResult.link;
            hadFailedStage ||= aiResult.outcome === "failed";
        } else {
            this.logRecovery(linkId, "finalize", "skipped", { reason: "unsupported_content_type", contentType });
            return;
        }

        const finalLink = await this.loadRecoveryLink(supabase, linkId, userId);
        if (!finalLink) {
            this.logRecovery(linkId, "finalize", "failed", { reason: "link_missing_after_recovery" });
            return;
        }

        if (!this.shouldRunRecovery(finalLink)) {
            this.logRecovery(linkId, "finalize", "success", {
                reason: "resolved",
                fetchStatus: finalLink.fetch_status,
                hasTags: !this.isAiMissing(finalLink),
                contentType,
            });
            return;
        }

        const shouldMarkFailed =
            hadFailedStage &&
            this.isFetchStillLoading(finalLink.fetch_status);

        if (shouldMarkFailed) {
            const { error } = await supabase
                .from("links")
                .update({
                    fetch_status: "failed",
                    fetched_at: new Date().toISOString(),
                })
                .eq("id", linkId)
                .eq("user_id", userId);

            if (error) {
                this.logRecovery(linkId, "finalize", "failed", { reason: "mark_failed_update_error", error: error.message, contentType });
                return;
            }

            this.logRecovery(linkId, "finalize", "success", { reason: "marked_failed_after_full_recovery_failure", contentType });
            return;
        }

        this.logRecovery(linkId, "finalize", "skipped", {
            reason: "still_unresolved_no_full_failure",
            fetchStatus: finalLink.fetch_status,
            hasTags: !this.isAiMissing(finalLink),
            contentType,
        });
    }

    private async enqueueEnrichmentJobs(
        userId: string,
        link: { id: string; url: string; content_type?: string },
        baseUrl?: string
    ): Promise<void> {
        const contentType = link.content_type || "url";

        if (contentType === "color" || contentType === "note") {
            return;
        }

        if (contentType === "image") {
            await enqueueAIVisionTagging({
                linkId: link.id,
                userId,
            }, { baseUrl });
            return;
        }

        await Promise.allSettled([
            enqueueMetadataEnrichment({
                linkId: link.id,
                url: link.url,
                userId,
            }, { baseUrl }),
            enqueueAITagging({
                linkId: link.id,
                userId,
            }, { baseUrl }),
        ]);
    }

    async handle(
        request: NextRequest,
        validatedData?: CreateLinkDTO,
        authenticatedUserId?: string
    ): Promise<NextResponse> {
        try {
            // Authenticate
            const userId = authenticatedUserId || await authenticateRequest(request);
            if (!userId) {
                return NextResponse.json(
                    {
                        error: {
                            code: ErrorCode.UNAUTHORIZED,
                            message: "Unauthorized",
                            userMessage: "Please sign in to continue"
                        }
                    },
                    { status: 401 }
                );
            }

            // Enforce plan limits
            const billingCtx = await getBillingContext(userId);
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

            // Use validated data if provided, otherwise fall back to old validation
            let createLinkDTO: CreateLinkDTO;
            
            if (validatedData) {
                // If title not provided, use domain as placeholder
                let title = validatedData.title || this.extractDomainFromUrl(validatedData.url);
                let url = validatedData.url;
                let colorValue = validatedData.color_value ?? null;

                if (validatedData.content_type === "color") {
                    const colorMetadata = resolveColorMetadata(validatedData.color_value || validatedData.url);
                    title = validatedData.title || colorMetadata.colorName;
                    url = colorMetadata.colorCode;
                    colorValue = colorMetadata.colorCode;
                }

                createLinkDTO = {
                    ...validatedData,
                    url,
                    title,
                    color_value: colorValue,
                };
            } else {
                // Old validation (for backward compatibility)
                const body = (await request.json()) as CreateLinkDTO; // Type cast the body
                const {
                    url,
                    title,
                    content_type = "url",
                    color_value,
                    favicon_url,
                    og_image_url,
                    description,
                    notes,
                    content_text,
                } = body;

                if (!url) {
                    return NextResponse.json(
                        {
                            error: {
                                code: ErrorCode.INVALID_INPUT,
                                message: "URL is required",
                                userMessage: "Please provide a URL"
                            }
                        },
                        { status: 400 }
                    );
                }

                // Use provided title or extract domain as placeholder
                let finalTitle = title || this.extractDomainFromUrl(url);
                let finalUrl = url;
                let finalColorValue = color_value || null;

                if (content_type === "color") {
                    const colorMetadata = resolveColorMetadata(color_value || url);
                    finalTitle = title || colorMetadata.colorName;
                    finalUrl = colorMetadata.colorCode;
                    finalColorValue = colorMetadata.colorCode;
                }

                createLinkDTO = {
                    url: finalUrl,
                    title: finalTitle,
                    content_type,
                    color_value: finalColorValue,
                    favicon_url: favicon_url || null,
                    og_image_url: og_image_url || null,
                    description: description || null,
                    notes: notes || null,
                    content_text: content_text || null,
                };
            }

            // Validate Link (only if it's a URL type)
            // Note: title is guaranteed to be set above (either from input or extracted from domain)
            if (createLinkDTO.content_type === 'url') {
                await this.validateLink(createLinkDTO.url, createLinkDTO.title!);
            }

            // Create link using service
            const { link, isDuplicate, isRestored } = await this.linkService.createLink(
                userId,
                createLinkDTO
            );

            const isExtensionSave = this.isExtensionSource(request);
            const callbackBaseUrl = request.nextUrl.origin;

            if (!isDuplicate) {
                await this.enqueueEnrichmentJobs(userId, link, callbackBaseUrl);
            }

            if (isExtensionSave && !isDuplicate && !isRestored) {
                after(async () => {
                    await this.runExtensionRecovery(link.id, userId);
                });
            }

            const forwardingResult = (!isDuplicate && !isRestored)
                ? await this.autoForwardingService.forwardLinks(userId, [link])
                : { forwardedSpaceNames: [], forwardedByLinkId: {} };

            const autoForwardedTo = forwardingResult.forwardedByLinkId[link.id] ?? null;

            return NextResponse.json(
                {
                    link,
                    duplicate: isDuplicate,
                    restored: isRestored,
                    auto_forwarded_to: autoForwardedTo,
                    auto_forwarded_spaces: forwardingResult.forwardedSpaceNames,
                },
                { status: isDuplicate ? 200 : 201 }
            );
        } catch (error) {
            const appError = toAppError(error);
            return NextResponse.json(
                {
                    error: {
                        code: appError.code,
                        message: appError.message,
                        userMessage: appError.getUserMessage()
                    }
                },
                { status: appError.statusCode }
            );
        }
    }
}
