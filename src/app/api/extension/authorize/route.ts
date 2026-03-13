import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitExtensionAuth, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { createOpaqueApiToken, revokeMatchingInstallTokens } from "@/lib/api-token-service";
import { EXTENSION_TOKEN_SCOPES } from "@/lib/api-tokens";


/**
 * POST /api/extension/authorize
 * Generate API token for extension authorization (one-click flow)
 * 
 * Body: { name?: string, installId?: string, state: string, clientId?: string, extensionVersion?: string, browserName?: string, platform?: string }
 * Returns: { token: string, state: string, user: { email: string, id: string } }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting for extension authorization
    const identifier = getIdentifier(request, user.id);
    const { success, limit, reset, remaining } = await rateLimitExtensionAuth.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many authorization attempts. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    interface AuthorizeBody {
      name?: string;
      installId?: string;
      state?: string;
      clientId?: string;
      extensionVersion?: string;
      browserName?: string;
      platform?: string;
    }

    const body = (await request.json().catch(() => ({}))) as AuthorizeBody;
    const name = body.name || "Extension";
    const installId = typeof body.installId === "string" && body.installId.trim() ? body.installId.trim() : null;
    const state = typeof body.state === "string" ? body.state.trim() : "";
    const clientId = typeof body.clientId === "string" && body.clientId.trim() ? body.clientId.trim() : "cadie-browser-extension";

    if (!state || state.length > 200) {
      return NextResponse.json({ error: "Valid auth state is required" }, { status: 400 });
    }

    // Store the hashed token in the database
    // Set expiration to 1 year from now for extension tokens
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const replacedTokenIds = installId
      ? await revokeMatchingInstallTokens(user.id, installId, clientId)
      : [];

    const createdToken = await createOpaqueApiToken({
      userId: user.id,
      name,
      expiresAt: expiresAt.toISOString(),
      scopes: EXTENSION_TOKEN_SCOPES,
      clientId,
      installId,
      installMetadata: {
        source: "browser_extension",
        extensionVersion: body.extensionVersion ?? null,
        browserName: body.browserName ?? null,
        platform: body.platform ?? null,
      },
      rotatedFromTokenId: replacedTokenIds[0] ?? null,
    });

    // Return the plaintext token (ONLY TIME we send it)
    return NextResponse.json({
      token: createdToken.plaintextToken,
      state,
      user: {
        id: user.id,
        email: user.email,
      },
      tokenInfo: {
        id: createdToken.record.id,
        name: createdToken.record.name,
        created_at: createdToken.record.createdAt,
        expires_at: createdToken.record.expiresAt,
        scope: createdToken.record.scopes,
        client_id: createdToken.record.clientId,
        install_id: createdToken.record.installId,
        rotated_from_token_id: createdToken.record.rotatedFromTokenId,
        replaced_token_ids: replacedTokenIds,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/extension/authorize:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
