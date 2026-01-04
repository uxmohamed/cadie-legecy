import { NextRequest, NextResponse } from "next/server";
import { UpdateLinkHandler, DeleteLinkHandler } from "@/features/links/api/handlers";
import { rateLimitLinks, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth-middleware";
import { validateUUID } from "@/lib/validation/validate";

/**
 * PUT /api/links/[id]
 * Update a link
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // UUID validation
  const uuidError = validateUUID(id, "Link ID");
  if (uuidError) return uuidError;
  
  // Rate limiting
  const userId = await authenticateRequest(request);
  const identifier = getIdentifier(request, userId || undefined);
  const { success, limit, reset, remaining } = await rateLimitLinks.limit(identifier);
  
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
    );
  }
  
  const handler = new UpdateLinkHandler();
  const response = await handler.handle(request, id);
  
  // Add rate limit headers
  const headers = getRateLimitHeaders(limit, remaining, reset);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * DELETE /api/links/[id]
 * Delete a link
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // UUID validation
  const uuidError = validateUUID(id, "Link ID");
  if (uuidError) return uuidError;
  
  // Rate limiting
  const userId = await authenticateRequest(request);
  const identifier = getIdentifier(request, userId || undefined);
  const { success, limit, reset, remaining } = await rateLimitLinks.limit(identifier);
  
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
    );
  }
  
  const handler = new DeleteLinkHandler();
  const response = await handler.handle(request, id);
  
  // Add rate limit headers
  const headers = getRateLimitHeaders(limit, remaining, reset);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
