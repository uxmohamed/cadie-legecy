import { NextRequest } from "next/server";
import { GetLinksHandler, CreateLinkHandler } from "@/features/links/api/handlers";



/**
 * GET /api/links
 * Retrieve links for the authenticated user
 */
export async function GET(request: NextRequest) {
  const handler = new GetLinksHandler();
  return handler.handle(request);
}

/**
 * POST /api/links
 * Create a new link
 */
export async function POST(request: NextRequest) {
  const handler = new CreateLinkHandler();
  return handler.handle(request);
}
