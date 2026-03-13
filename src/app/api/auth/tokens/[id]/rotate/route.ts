import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveApiTokenForUser, createOpaqueApiToken, revokeApiToken } from "@/lib/api-token-service";
import { validateUUID } from "@/lib/validation/validate";

/**
 * POST /api/auth/tokens/[id]/rotate
 * Rotate an existing active API token.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const uuidError = validateUUID(id, "Token ID");
    if (uuidError) return uuidError;

    const existingToken = await getActiveApiTokenForUser(id, user.id);
    if (!existingToken) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    const createdToken = await createOpaqueApiToken({
      userId: user.id,
      name: existingToken.name,
      expiresAt: existingToken.expires_at,
      scopes: existingToken.scope,
      clientId: existingToken.client_id,
      installId: existingToken.install_id,
      installMetadata: existingToken.install_metadata ?? {},
      rotatedFromTokenId: existingToken.id,
    });

    await revokeApiToken(id, user.id, "rotated");

    return NextResponse.json(
      {
        token: createdToken.plaintextToken,
        tokenInfo: {
          id: createdToken.record.id,
          name: createdToken.record.name,
          created_at: createdToken.record.createdAt,
          expires_at: createdToken.record.expiresAt,
          scope: createdToken.record.scopes,
          rotated_from_token_id: createdToken.record.rotatedFromTokenId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/auth/tokens/[id]/rotate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
