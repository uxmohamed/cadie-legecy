import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateUUID } from "@/lib/validation/validate";


/**
 * DELETE /api/auth/tokens/[id]
 * Revoke (delete) an API token
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

    // Delete the token (RLS ensures user can only delete their own tokens)
    const { error } = await supabase
      .from("api_tokens")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting token:", error);
      return NextResponse.json(
        { error: "Failed to delete token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/auth/tokens/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

