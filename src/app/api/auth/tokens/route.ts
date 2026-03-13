import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitAuth, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { validateRequestBody } from "@/lib/validation/validate";
import { createTokenSchema } from "@/lib/validation/auth.schemas";
import { createOpaqueApiToken } from "@/lib/api-token-service";


/**
 * GET /api/auth/tokens
 * List all API tokens for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const identifier = getIdentifier(request, user.id);
    const { success, limit, reset, remaining } = await rateLimitAuth.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: getRateLimitHeaders(limit, remaining, reset)
        }
      );
    }

    // Fetch all tokens for the user (without token_hash)
    const { data: tokens, error } = await supabase
      .from("api_tokens")
      .select("id, name, last_used_at, created_at, expires_at, scope, client_id, install_id, install_metadata")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tokens:", error);
      return NextResponse.json(
        { error: "Failed to fetch tokens" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ tokens: tokens || [] });
    response.headers.set("Cache-Control", "private, max-age=0");
    return response;
  } catch (error) {
    console.error("Error in GET /api/auth/tokens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/tokens
 * Generate a new API token
 * 
 * Body: { name: string }
 * Returns: { token: string, id: string, name: string, created_at: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const identifier = getIdentifier(request, user.id);
    const { success, limit, reset, remaining } = await rateLimitAuth.limit(identifier);
    
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
      createTokenSchema
    );
    
    if (validationError) {
      return validationError;
    }

    const { name, scope } = validatedData;
    
    // Set expiration (90 days from now)
    const DEFAULT_TOKEN_EXPIRATION_DAYS = 90;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DEFAULT_TOKEN_EXPIRATION_DAYS);

    const createdToken = await createOpaqueApiToken({
      userId: user.id,
      name,
      expiresAt: expiresAt.toISOString(),
      scopes: scope,
    });

    // Return the plaintext token (ONLY TIME we send it) and expiration
    return NextResponse.json({
      token: createdToken.plaintextToken,
      id: createdToken.record.id,
      name: createdToken.record.name,
      created_at: createdToken.record.createdAt,
      expires_at: createdToken.record.expiresAt,
      scope: createdToken.record.scopes,
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/auth/tokens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
