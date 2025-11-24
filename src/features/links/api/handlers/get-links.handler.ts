import { NextRequest, NextResponse } from "next/server";
import { LinkService } from "@/features/links/services";
import { MetadataService } from "@/features/links/services";
import { DuplicateDetectionService } from "@/features/links/services";
import { SupabaseLinkRepository } from "@/features/links/repositories";
import { authenticateRequest } from "@/lib/auth-middleware";

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
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            // Parse query parameters
            const searchParams = request.nextUrl.searchParams;
            const categoryId = searchParams.get("category_id") || undefined;
            const isArchived = searchParams.get("is_archived") === "true";

            // Get links using service
            const links = await this.linkService.getLinks(userId, {
                category_id: categoryId,
                is_archived: isArchived,
            });

            return NextResponse.json({ links });
        } catch (error) {
            console.error("Error fetching links:", error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
            );
        }
    }
}
