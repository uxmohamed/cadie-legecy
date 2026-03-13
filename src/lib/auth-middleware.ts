import { NextRequest } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";

export type AuthSource = "session" | "api_token";

export interface ApiTokenMetadata {
  id: string;
  expiresAt: string;
  scopes: readonly ["legacy_full_access"];
}

export interface RequestContext {
  userId: string;
  authSource: AuthSource;
  token: ApiTokenMetadata | null;
}

/**
 * Resolves the authenticated actor for either a session or API token request.
 */
export async function createRequestContext(
  request: NextRequest
): Promise<RequestContext | null> {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const apiToken = await authenticateApiToken(token);
    if (!apiToken) {
      return null;
    }

    return {
      userId: apiToken.userId,
      authSource: "api_token",
      token: {
        id: apiToken.tokenId,
        expiresAt: apiToken.expiresAt,
        scopes: ["legacy_full_access"] as const,
      },
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return null;
  }

  return {
    userId: user.id,
    authSource: "session",
    token: null,
  };
}

/**
 * Compatibility wrapper for unchanged routes that only need the user id.
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<string | null> {
  const context = await createRequestContext(request);
  return context?.userId ?? null;
}

/**
 * Authenticates using an API token
 * @param token - The plaintext token
 * @returns The token subject if valid, null otherwise
 */
async function authenticateApiToken(
  token: string
): Promise<{ userId: string; tokenId: string; expiresAt: string } | null> {
  if (!token || token.length < 32) {
    // SECURITY: Don't log token details - could aid attackers
    log.warn("[AUTH] Invalid token format");
    return null;
  }

  try {
    // Hash the token using SHA-256 (matching the hash we store)
    const tokenHash = await hashToken(token);

    // SECURITY: Don't log hash prefix - could aid brute force attacks

    // Intentional elevated path: token verification requires service-role access.
    const supabase = createAdminClient();

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
      // SECURITY: Log generic message only - don't reveal whether token exists
      log.warn("[AUTH] Token authentication failed");
      return null;
    }

    // SECURITY: Don't log userId in production - use structured audit logging instead
    if (process.env.NODE_ENV === 'development') {
      log.debug("[AUTH] Token authenticated successfully");
    }

    // Update last_used_at timestamp asynchronously (don't await)
    updateTokenLastUsed(tokenRecord.id).catch(() => {
      // SECURITY: Don't log token ID - use generic message
      log.warn("[AUTH] Failed to update token last used timestamp");
    });

    return {
      userId: tokenRecord.user_id,
      tokenId: tokenRecord.id,
      expiresAt: tokenRecord.expires_at,
    };
  } catch {
    // SECURITY: Don't log error details that could reveal system internals
    log.error("[AUTH] Token authentication error");
    return null;
  }
}

/**
 * Updates the last_used_at timestamp for a token
 * @param tokenId - The token ID
 */
async function updateTokenLastUsed(tokenId: string): Promise<void> {
  const supabase = createAdminClient();

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
