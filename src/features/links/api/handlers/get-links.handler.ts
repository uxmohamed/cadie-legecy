import { NextRequest, NextResponse } from "next/server";
import { LinkService } from "@/features/links/services";
import { MetadataService } from "@/features/links/services";
import { DuplicateDetectionService } from "@/features/links/services";
import { SupabaseLinkRepository } from "@/features/links/repositories";
import { authenticateRequest } from "@/lib/auth-middleware";
import { toAppError, ErrorCode } from "@/lib/errors";

/**
 * Handler for GET /api/links
 * Retrieves links for the authenticated user
 */
export class GetLinksHandler {
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

    async handle(request: NextRequest): Promise<NextResponse> {
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

            // Parse query parameters
            const searchParams = request.nextUrl.searchParams;
            const limit = parseInt(searchParams.get("limit") || "50");
            const offset = parseInt(searchParams.get("offset") || "0");
            const categoryId = searchParams.get("category_id") || undefined;
            const isArchived = searchParams.get("is_archived") === "true";
            const isDeleted = searchParams.get("is_deleted") === "true";

            // Get links using service
            const result = await this.linkService.getLinks(userId, {
                category_id: categoryId,
                is_archived: isArchived,
                is_deleted: isDeleted,
            }, limit, offset);

            return NextResponse.json(result);
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
