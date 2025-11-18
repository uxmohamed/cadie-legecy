import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateToken, hashToken } from "@/lib/auth-middleware";

/**
 * GET /api/auth/tokens
 * List all API tokens for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all tokens for the user (without token_hash)
    const { data: tokens, error } = await supabase
      .from("api_tokens")
      .select("id, name, last_used_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tokens:", error);
      return NextResponse.json(
        { error: "Failed to fetch tokens" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tokens: tokens || [] });
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

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Token name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Token name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Generate a new token (plaintext)
    const token = generateToken(32); // 32 bytes = 43 characters in base64url
    
    // Hash the token for storage
    const tokenHash = hashToken(token);

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
      id: tokenRecord.id,
      name: tokenRecord.name,
      created_at: tokenRecord.created_at,
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/auth/tokens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

