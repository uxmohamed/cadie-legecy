import { NextRequest, NextResponse } from "next/server";
import { GetLinksHandler, CreateLinkHandler } from "@/features/links/api/handlers";
import { rateLimitLinks, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth-middleware";

/**
 * GET /api/links
 * Retrieve links for the authenticated user
 */
export async function GET(request: NextRequest) {
  // Authenticate to get userId for rate limiting
  const userId = await authenticateRequest(request);
  
  // Apply rate limiting
  const identifier = getIdentifier(request, userId || undefined);
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
  const handler = new GetLinksHandler();
  const response = await handler.handle(request);
  
  // Add rate limit headers to response
  const headers = getRateLimitHeaders(limit, remaining, reset);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * POST /api/links
 * Create a new link
 */
export async function POST(request: NextRequest) {
  // Authenticate to get userId for rate limiting
  const userId = await authenticateRequest(request);
  
  // Apply rate limiting
  const identifier = getIdentifier(request, userId || undefined);
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
  const handler = new CreateLinkHandler();
  const response = await handler.handle(request);
  
  // Add rate limit headers to response
  const headers = getRateLimitHeaders(limit, remaining, reset);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
