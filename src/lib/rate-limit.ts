import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Rate limiter for authentication endpoints
 * Limit: 5 requests per minute
 * Used for: /api/auth/tokens (create/delete)
 */
export const rateLimitAuth = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "ratelimit:auth",
});

/**
 * Rate limiter for link CRUD operations
 * Limit: 100 requests per minute
 * Used for: /api/links/* (GET, POST, PUT, DELETE)
 */
export const rateLimitLinks = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:links",
});

/**
 * Rate limiter for metadata operations
 * Limit: 20 requests per minute
 * Used for: /api/metadata, /api/links/[id]/metadata
 */
export const rateLimitMetadata = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "ratelimit:metadata",
});

/**
 * Rate limiter for smart search interpretation endpoint
 * Limit: 30 requests per minute
 * Used for: /api/search/interpret
 */
export const rateLimitSearch = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "ratelimit:search",
});

/**
 * Rate limiter for space operations
 * Limit: 30 requests per minute
 * Used for: /api/spaces
 */
export const rateLimitSpaces = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "ratelimit:spaces",
});

/**
 * Rate limiter for category operations (deprecated - use rateLimitSpaces)
 * @deprecated Use rateLimitSpaces instead. Categories have been replaced by Spaces.
 */
export const rateLimitCategories = rateLimitSpaces;

/**
 * Rate limiter for account deletion (very strict)
 * Limit: 3 requests per hour
 * Used for: /api/auth/delete-account
 */
export const rateLimitAccountDeletion = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  analytics: true,
  prefix: "ratelimit:account-delete",
});

/**
 * Rate limiter for extension authorization
 * Limit: 10 requests per minute
 * Used for: /api/extension/authorize
 */
export const rateLimitExtensionAuth = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ratelimit:extension-auth",
});

/**
 * Rate limiter for permanent deletion operations (strict)
 * Limit: 50 requests per minute
 * Used for: /api/links/[id]/permanent
 */
export const rateLimitPermanentDelete = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 m"),
  analytics: true,
  prefix: "ratelimit:permanent-delete",
});

/**
 * Helper to get identifier for rate limiting
 * Uses user ID if authenticated, otherwise IP address
 */
export function getIdentifier(request: Request, userId?: string): string {
  // Use user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address for unauthenticated requests
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get("x-real-ip") || 
             "unknown";
  
  return `ip:${ip}`;
}

/**
 * Helper to create rate limit response headers
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number
): Record<string, string> {
  return {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": reset.toString(),
    "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
  };
}
