import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateToken, hashToken } from "@/lib/auth-middleware";

export const runtime = 'edge';

/**
 * POST /api/extension/authorize
 * Generate API token for extension authorization (one-click flow)
 * 
 * Body: { name?: string }
 * Returns: { token: string, user: { email: string, id: string } }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name = body.name || "Chrome Extension";

    // Generate a new token (plaintext)
    const token = generateToken(32); // 32 bytes = 43 characters in base64url
    
    // Hash the token for storage
    const tokenHash = hashToken(token);

    // Check if user already has a token with this name, revoke it
    const { data: existingTokens } = await supabase
      .from("api_tokens")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", name);

    if (existingTokens && existingTokens.length > 0) {
      // Delete existing token(s) with same name
      await supabase
        .from("api_tokens")
        .delete()
        .eq("user_id", user.id)
        .eq("name", name);
    }

    // Store the hashed token in the database
    const { data: tokenRecord, error } = await supabase
      .from("api_tokens")
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        name: name.trim(),
      })
      .select("id, name, created_at")
      .single();

    if (error) {
      console.error("Error creating token:", error);
      return NextResponse.json(
        { error: "Failed to create token" },
        { status: 500 }
      );
    }

    // Return the plaintext token (ONLY TIME we send it)
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
      tokenInfo: {
        id: tokenRecord.id,
        name: tokenRecord.name,
        created_at: tokenRecord.created_at,
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


