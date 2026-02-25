import { NextRequest, NextResponse } from "next/server";
import { LinkService } from "@/features/links/services";
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
        this.linkService = new LinkService(repository);
    }

    async handle(request: NextRequest, authenticatedUserId?: string): Promise<NextResponse> {
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

            // Parse query parameters
            const searchParams = request.nextUrl.searchParams;
            const limit = parseInt(searchParams.get("limit") || "20");
            const offset = parseInt(searchParams.get("offset") || "0");
            const spaceId = searchParams.get("space_id") || undefined;
            const isArchived = searchParams.get("is_archived") === "true";
            const isDeleted = searchParams.get("is_deleted") === "true";
            const searchQuery = searchParams.get("q") || undefined;

            // Get links using service
            const result = await this.linkService.getLinks(userId, {
                space_id: spaceId,
                is_archived: isArchived,
                is_deleted: isDeleted,
            }, limit, offset, searchQuery);

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
