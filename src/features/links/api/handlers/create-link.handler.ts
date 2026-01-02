import { NextRequest, NextResponse } from "next/server";
import { LinkService } from "@/features/links/services";
import { MetadataService } from "@/features/links/services";
import { DuplicateDetectionService } from "@/features/links/services";
import { SupabaseLinkRepository } from "@/features/links/repositories";
import { authenticateRequest } from "@/lib/auth-middleware";
import type { CreateLinkDTO } from "@/features/links/types";
import { isAppError, toAppError, ErrorCode, AppError } from "@/lib/errors";

/**
 * Handler for POST /api/links
 * Creates a new link for the authenticated user
 */
export class CreateLinkHandler {
    private linkService: LinkService;

    constructor() {
        const repository = new SupabaseLinkRepository();
        const metadataService = new MetadataService();
        const duplicateDetectionService = new DuplicateDetectionService();
        this.linkService = new LinkService(
            repository,
            metadataService,
            duplicateDetectionService
        );
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

        // 3. Reachability check (Head request)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                headers: { 'User-Agent': 'Cadie-Link-Validator/1.0' }
            });

            clearTimeout(timeoutId);

            if (!response.ok && response.status !== 405 && response.status !== 403) {
                // 405 Method Not Allowed and 403 Forbidden are common for HEAD requests on some sites,
                // so we might want to allow them or try GET. For now, fail on 404/500.
                if (response.status === 404) {
                    throw new Error("Not found");
                }
            }
        } catch (error) {
            // Network error or timeout
            throw new AppError(
                ErrorCode.INVALID_INPUT,
                "Link is not reachable",
                400
            );
        }
    }

    async handle(request: NextRequest, validatedData?: CreateLinkDTO): Promise<NextResponse> {
        try {
            // Authenticate
            const userId = await authenticateRequest(request);
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
                createLinkDTO = validatedData;
            } else {
                // Old validation (for backward compatibility)
                const body = (await request.json()) as CreateLinkDTO; // Type cast the body
                const {
                    url,
                    title,
                    content_type = "url",
                    category_id,
                    color_value,
                    favicon_url,
                    og_image_url,
                    description,
                } = body;

                if (!url || !title) {
                    return NextResponse.json(
                        {
                            error: {
                                code: ErrorCode.INVALID_INPUT,
                                message: "URL and title are required",
                                userMessage: "Please check your input and try again"
                            }
                        },
                        { status: 400 }
                    );
                }

                createLinkDTO = {
                    url,
                    title,
                    content_type,
                    category_id: category_id || null,
                    color_value: color_value || null,
                    favicon_url: favicon_url || null,
                    og_image_url: og_image_url || null,
                    description: description || null,
                };
            }

            // Validate Link (only if it's a URL type)
            if (createLinkDTO.content_type === 'url') {
                await this.validateLink(createLinkDTO.url, createLinkDTO.title);
            }

            // Create link using service
            const { link, isDuplicate, isRestored } = await this.linkService.createLink(
                userId,
                createLinkDTO
            );

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
