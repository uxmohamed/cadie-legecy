import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

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
    if (userId) {
      return userId;
    }
  }

  // Fall back to session-based authentication
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
    return null;
  }

  try {
    // Hash the token using SHA-256 (matching the hash we store)
    const tokenHash = hashToken(token);
    
    // Use service role to query api_tokens table
    // We need to use service role because RLS won't let us query without auth
    const supabase = await createClient();
    
    // Look up token in database
    const { data: tokenRecord, error } = await supabase
      .from("api_tokens")
      .select("user_id, id")
      .eq("token_hash", tokenHash)
      .single();

    if (error || !tokenRecord) {
      console.error("Token authentication failed:", error?.message);
      return null;
    }

    // Update last_used_at timestamp asynchronously (don't await)
    updateTokenLastUsed(tokenRecord.id).catch((err) => {
      console.error("Failed to update token last_used_at:", err);
    });

    return tokenRecord.user_id;
  } catch (error) {
    console.error("Error during token authentication:", error);
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
 * Hashes a token using SHA-256
 * @param token - The plaintext token
 * @returns The hashed token
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a cryptographically secure random token
 * @param length - The length of the token in bytes (default 32)
 * @returns A random token string
 */
export function generateToken(length: number = 32): string {
  const crypto = require("crypto");
  return crypto.randomBytes(length).toString("base64url");
}

