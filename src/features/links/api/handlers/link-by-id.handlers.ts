import { NextRequest, NextResponse } from "next/server";
import { LinkService } from "@/features/links/services";
import { MetadataService } from "@/features/links/services";
import { DuplicateDetectionService } from "@/features/links/services";
import { SupabaseLinkRepository } from "@/features/links/repositories";
import { authenticateRequest } from "@/lib/auth-middleware";
import type { UpdateLinkDTO } from "@/features/links/types";
import { toAppError, ErrorCode } from "@/lib/errors";

/**
 * Handler for PUT /api/links/[id]
 * Updates an existing link
 */
export class UpdateLinkHandler {
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

    async handle(request: NextRequest, id: string): Promise<NextResponse> {
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

            // Parse request body
            const body = (await request.json()) as UpdateLinkDTO;
            const updateDTO: UpdateLinkDTO = body;

            // Update link using service
            const link = await this.linkService.updateLink(id, userId, updateDTO);

            return NextResponse.json({ link });
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

/**
 * Handler for DELETE /api/links/[id]
 * Deletes a link
 */
export class DeleteLinkHandler {
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

    async handle(request: NextRequest, id: string): Promise<NextResponse> {
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

            // Delete link using service
            await this.linkService.deleteLink(id, userId);

            return NextResponse.json({ success: true });
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
