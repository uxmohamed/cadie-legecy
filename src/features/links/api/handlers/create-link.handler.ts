import { NextRequest, NextResponse, after } from "next/server";
import { LinkService } from "@/features/links/services";
import { SupabaseLinkRepository } from "@/features/links/repositories";
import { MetadataService } from "@/features/links/services/metadata.service";
import { authenticateRequest } from "@/lib/auth-middleware";
import type { CreateLinkDTO } from "@/features/links/types";
import { toAppError, ErrorCode, AppError } from "@/lib/errors";
import { resolveColorMetadata } from "@/lib/canonicalize";
import { enqueueMetadataEnrichment, enqueueAITagging, enqueueAIVisionTagging, isJobQueueConfigured } from "@/lib/job-queue";

/**
 * Handler for POST /api/links
 * Creates a new link for the authenticated user
 */
export class CreateLinkHandler {
    private linkService: LinkService;

    constructor() {
        const repository = new SupabaseLinkRepository();
        this.linkService = new LinkService(repository);
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

    private async enqueueEnrichmentJobs(userId: string, link: { id: string; url: string; content_type?: string }): Promise<void> {
        const contentType = link.content_type || "url";
        const hasQueue = isJobQueueConfigured();

        if (contentType === "color") {
            return;
        }

        if (contentType === "image") {
            if (hasQueue) {
                await enqueueAIVisionTagging({
                    linkId: link.id,
                    userId,
                });
            }
            return;
        }

        if (hasQueue) {
            await Promise.allSettled([
                enqueueMetadataEnrichment({
                    linkId: link.id,
                    url: link.url,
                    userId,
                }),
                enqueueAITagging({
                    linkId: link.id,
                    userId,
                }),
            ]);
            return;
        }

        // Local/dev fallback when queue is unavailable.
        const metadataService = new MetadataService();
        await metadataService.enrichLink(link.id, link.url, contentType);
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

            if (!isDuplicate) {
                after(async () => {
                    try {
                        await this.enqueueEnrichmentJobs(userId, link);
                    } catch (error) {
                        console.error("[CreateLinkHandler] Failed to enqueue enrichment jobs:", error);
                    }
                });
            }

            return NextResponse.json(
                { link, duplicate: isDuplicate, restored: isRestored },
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
