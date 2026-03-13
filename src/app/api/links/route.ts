import { NextRequest, NextResponse } from "next/server";
import { GetLinksHandler, CreateLinkHandler } from "@/features/links/api/handlers";
import { rateLimitLinks, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { createRequestContext } from "@/lib/auth-middleware";
import { validateRequestBody } from "@/lib/validation/validate";
import { createLinkSchema } from "@/lib/validation/link.schemas";
import type { CreateLinkDTO } from "@/features/links/types";


// Create singleton instances (instantiated once, reused across requests)
const getLinksHandler = new GetLinksHandler();
const createLinkHandler = new CreateLinkHandler();

/**
 * GET /api/links
 * Retrieve links for the authenticated user
 * Marked no-store so list reads never serve stale data after mutations.
 */
export async function GET(request: NextRequest) {
  const context = await createRequestContext(request);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Apply rate limiting
  const identifier = getIdentifier(request, context.userId);
  const { success, limit, reset, remaining } = await rateLimitLinks.limit(identifier);
  
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: getRateLimitHeaders(limit, remaining, reset)
      }
    );
  }
  
  // Continue with handler
  const response = await getLinksHandler.handle(request, context.userId);
  
  // Add rate limit headers to response
  const headers = getRateLimitHeaders(limit, remaining, reset);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Keep link lists out of HTTP caches. React Query handles freshness on the client,
  // and stale cached responses can overwrite optimistic link inserts.
  response.headers.set("Cache-Control", "private, no-store");
  
  return response;
}

/**
 * POST /api/links
 * Create a new link
 */
export async function POST(request: NextRequest) {
  const context = await createRequestContext(request);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Apply rate limiting
  const identifier = getIdentifier(request, context.userId);
  const { success, limit, reset, remaining } = await rateLimitLinks.limit(identifier);
  
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: getRateLimitHeaders(limit, remaining, reset)
      }
    );
  }
  
  // Validate request body
  const { data: validatedData, error: validationError } = await validateRequestBody(
    request,
    createLinkSchema
  );
  
  if (validationError) {
    return validationError;
  }
  
  // Continue with handler
  // Convert undefined to null for optional fields to match DTO type
  const dto: CreateLinkDTO = {
    ...validatedData,
    og_image_url: validatedData.og_image_url ?? null,
    favicon_url: validatedData.favicon_url ?? null,
    description: validatedData.description ?? null,
    color_value: validatedData.color_value ?? null,
  };
  
  const response = await createLinkHandler.handle(request, dto, context);
  
  // Add rate limit headers to response
  const headers = getRateLimitHeaders(limit, remaining, reset);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
