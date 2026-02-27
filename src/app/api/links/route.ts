import { NextRequest, NextResponse } from "next/server";
import { GetLinksHandler, CreateLinkHandler } from "@/features/links/api/handlers";
import { rateLimitLinks, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth-middleware";
import { validateRequestBody } from "@/lib/validation/validate";
import { createLinkSchema } from "@/lib/validation/link.schemas";
import type { CreateLinkDTO } from "@/features/links/types";


// Create singleton instances (instantiated once, reused across requests)
const getLinksHandler = new GetLinksHandler();
const createLinkHandler = new CreateLinkHandler();

/**
 * GET /api/links
 * Retrieve links for the authenticated user
 * Optimized with caching headers for faster subsequent loads
 */
export async function GET(request: NextRequest) {
  // Authenticate to get userId for rate limiting
  const userId = await authenticateRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Apply rate limiting
  const identifier = getIdentifier(request, userId);
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
  const response = await getLinksHandler.handle(request, userId);
  
  // Add rate limit headers to response
  const headers = getRateLimitHeaders(limit, remaining, reset);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add caching headers for better performance
  // private: only cache for this user (authenticated endpoint)
  // max-age=0: always revalidate with server
  // stale-while-revalidate=60: serve stale while revalidating in background for up to 60s
  response.headers.set(
    "Cache-Control",
    "private, max-age=0, stale-while-revalidate=60"
  );
  
  return response;
}

/**
 * POST /api/links
 * Create a new link
 */
export async function POST(request: NextRequest) {
  // Authenticate to get userId for rate limiting
  const userId = await authenticateRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Apply rate limiting
  const identifier = getIdentifier(request, userId);
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
  
  const response = await createLinkHandler.handle(request, dto, userId);
  
  // Add rate limit headers to response
  const headers = getRateLimitHeaders(limit, remaining, reset);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
