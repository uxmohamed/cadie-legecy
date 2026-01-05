import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";


/**
 * Allowed redirect base paths after authentication
 */
const ALLOWED_REDIRECT_PATHS = new Set([
  '/',
  '/extension',
  '/settings',
  '/homepage',
]);

/**
 * Allowed path prefixes (paths can continue after the base)
 */
const ALLOWED_PATH_PREFIXES = [
  '/extension/',
  '/settings/',
  '/homepage/',
  '/space/',
  '/trash',
];

/**
 * Blocked redirect path prefixes that should never be used as redirect targets
 */
const BLOCKED_PATH_PREFIXES = [
  '/api',
  '/admin',
  '/auth',
];

/**
 * Validate and sanitize the redirect path
 * Prevents open redirect attacks by only allowing relative paths to known routes
 */
function sanitizeRedirectPath(path: string | null): string {
  // Default to home if no path provided
  if (!path) return '/';
  
  // SECURITY: Must be a relative path (not protocol-relative like //evil.com)
  if (!path.startsWith('/') || path.startsWith('//')) {
    return '/';
  }
  
  // SECURITY: Remove any query params for validation, but preserve them after validation
  const pathOnly = path.split('?')[0].split('#')[0];
  
  // SECURITY: Block sensitive paths (check both with and without trailing slash)
  for (const blockedPrefix of BLOCKED_PATH_PREFIXES) {
    if (pathOnly === blockedPrefix || pathOnly.startsWith(blockedPrefix + '/')) {
      return '/';
    }
  }
  
  // SECURITY: Check if path is exactly one of the allowed paths or under allowed prefixes
  const isExactMatch = ALLOWED_REDIRECT_PATHS.has(pathOnly);
  const isUnderAllowedPrefix = ALLOWED_PATH_PREFIXES.some(prefix => 
    pathOnly.startsWith(prefix)
  );
  
  if (!isExactMatch && !isUnderAllowedPrefix) {
    return '/';
  }
  
  // Path is safe, return the original (with query params if any)
  return path;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  
  // SECURITY: Sanitize redirect path to prevent open redirects
  const next = sanitizeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Determine the correct redirect URL
      // Multi-environment support: Always use the request's origin/host to ensure we redirect 
      // to the same domain that received the callback (staging vs production)
      // This ensures that:
      // - Staging auth callbacks redirect back to staging
      // - Production auth callbacks redirect back to production
      // - Works regardless of Supabase Site URL configuration
      const forwardedHost = request.headers.get("x-forwarded-host");
      const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
      const requestUrl = new URL(request.url);
      
      let redirectUrl: string;
      
      // Priority: Use forwarded headers (from proxy/load balancer) if available, otherwise use request origin
      if (forwardedHost) {
        redirectUrl = `${forwardedProto}://${forwardedHost}${next}`;
      } else {
        // Use the origin from the request URL (this will be staging URL if called from staging)
        redirectUrl = `${requestUrl.origin}${next}`;
      }
      
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If there's an error or no code, redirect to auth page
  // Use the same logic for error redirects - always use request origin
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const requestUrl = new URL(request.url);
  
  let authUrl: string;
  if (forwardedHost) {
    authUrl = `${forwardedProto}://${forwardedHost}/auth`;
  } else {
    // Use the origin from the request URL (this will be staging URL if called from staging)
    authUrl = `${requestUrl.origin}/auth`;
  }
  
  return NextResponse.redirect(authUrl);
}

