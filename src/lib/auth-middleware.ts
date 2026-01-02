import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
}

/**
 * Authenticates a request using either:
 * 1. Bearer token from Authorization header (for extension/API)
 * 2. Session cookie (for web app)
 * 
 * @param request - The incoming request
 * @returns The user ID if authenticated, null otherwise
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<string | null> {
  // First, try Bearer token authentication
  const authHeader = request.headers.get("authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const userId = await authenticateWithToken(token);
    // If Bearer token was provided but is invalid, DON'T fall back to session
    // This ensures revoked tokens properly fail
    if (!userId) {
      return null;
    }
    return userId;
  }

  // Fall back to session-based authentication (only when no Bearer token provided)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return user?.id || null;
}

/**
 * Authenticates using an API token
 * @param token - The plaintext token
 * @returns The user ID if valid, null otherwise
 */
async function authenticateWithToken(token: string): Promise<string | null> {
  if (!token || token.length < 32) {
    if (process.env.NODE_ENV === 'development') {
      log.debug("[AUTH] Token validation failed", { reason: 'too_short_or_missing', length: token?.length || 0 });
    }
    return null;
  }

  try {
    // Hash the token using SHA-256 (matching the hash we store)
    const tokenHash = await hashToken(token);
    if (process.env.NODE_ENV === 'development') {
      log.debug("[AUTH] Looking up token", { hashPrefix: tokenHash.substring(0, 16) });
    }
    
    // Use service role to query api_tokens table
    // We need to use service role because RLS won't let us query without auth
    const supabase = await createClient();
    
    // Current timestamp for expiration check
    const now = new Date().toISOString();
    
    // Look up token in database and check expiration
    const { data: tokenRecord, error } = await supabase
      .from("api_tokens")
      .select("user_id, id, expires_at")
      .eq("token_hash", tokenHash)
      .gt("expires_at", now) // Only return non-expired tokens
      .single();

    if (error || !tokenRecord) {
      const reason = error?.code === 'PGRST116' ? 'token_not_found_or_expired' : 'query_error';
      log.error("Token authentication failed", error, { found: false, reason });
      if (process.env.NODE_ENV === 'development') {
        log.debug("[AUTH] Token not found or expired", { reason });
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      log.debug("[AUTH] Token authenticated successfully", { userId: tokenRecord.user_id });
    }

    // Update last_used_at timestamp asynchronously (don't await)
    updateTokenLastUsed(tokenRecord.id).catch((err) => {
      log.error("Failed to update token last_used_at", err, { tokenId: tokenRecord.id });
    });

    return tokenRecord.user_id;
  } catch (error) {
    log.error("Error during token authentication", error);
    return null;
  }
}

/**
 * Updates the last_used_at timestamp for a token
 * @param tokenId - The token ID
 */
async function updateTokenLastUsed(tokenId: string): Promise<void> {
  const supabase = await createClient();
  
  await supabase
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenId);
}

/**
 * Hashes a token using SHA-256 (Web Crypto API for Edge Runtime compatibility)
 * @param token - The plaintext token
 * @returns The hashed token
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a cryptographically secure random token (Web Crypto API)
 * @param length - The length of the token in bytes (default 32)
 * @returns A random token string
 */
export function generateToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}


