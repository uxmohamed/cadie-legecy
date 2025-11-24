import { NextRequest, NextResponse } from "next/server";
import { LinkService } from "@/features/links/services";
import { MetadataService } from "@/features/links/services";
import { DuplicateDetectionService } from "@/features/links/services";
import { SupabaseLinkRepository } from "@/features/links/repositories";
import { authenticateRequest } from "@/lib/auth-middleware";
import type { UpdateLinkDTO } from "@/features/links/types";

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
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            // Parse request body
            const body = await request.json();
            const updateDTO: UpdateLinkDTO = body;

            // Update link using service
            const link = await this.linkService.updateLink(id, userId, updateDTO);

            return NextResponse.json({ link });
        } catch (error) {
            console.error("Error updating link:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
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
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            // Delete link using service
            await this.linkService.deleteLink(id, userId);

            return NextResponse.json({ success: true });
        } catch (error) {
            console.error("Error deleting link:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
            );
        }
    }
}
