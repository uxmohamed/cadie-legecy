import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateUUID } from "@/lib/validation/validate";
import { revokeApiToken } from "@/lib/api-token-service";


/**
 * DELETE /api/auth/tokens/[id]
 * Revoke an API token
 */
export async function DELETE(
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

    // UUID validation
    const uuidError = validateUUID(id, "Token ID");
    if (uuidError) return uuidError;

    await revokeApiToken(id, user.id, "manual");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/auth/tokens/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
