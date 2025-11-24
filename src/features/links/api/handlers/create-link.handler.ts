import { NextRequest, NextResponse } from "next/server";
import { LinkService } from "@/features/links/services";
import { MetadataService } from "@/features/links/services";
import { DuplicateDetectionService } from "@/features/links/services";
import { SupabaseLinkRepository } from "@/features/links/repositories";
import { authenticateRequest } from "@/lib/auth-middleware";
import type { CreateLinkDTO } from "@/features/links/types";

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

    async handle(request: NextRequest): Promise<NextResponse> {
        try {
            // Authenticate
            const userId = await authenticateRequest(request);
            if (!userId) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            // Parse and validate request body
            const body = await request.json();
            const {
                url,
                title,
                content_type = "url",
                category_id,
                color_value,
                favicon_url,
                og_image_url,
                description,
                rich_text_content,
            } = body;

            if (!url || !title) {
                return NextResponse.json(
                    { error: "URL and title are required" },
                    { status: 400 }
                );
            }

            // Create DTO
            const createLinkDTO: CreateLinkDTO = {
                url,
                title,
                content_type,
                category_id: category_id || null,
                color_value: color_value || null,
                favicon_url: favicon_url || null,
                og_image_url: og_image_url || null,
                description: description || null,
                rich_text_content: rich_text_content || null,
            };

            // Create link using service
            const { link, isDuplicate } = await this.linkService.createLink(
                userId,
                createLinkDTO
            );

            return NextResponse.json(
                { link, duplicate: isDuplicate },
                { status: isDuplicate ? 200 : 201 }
            );
        } catch (error) {
            console.error("Error creating link:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
            );
        }
    }
}
