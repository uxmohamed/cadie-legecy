import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";


/**
 * DELETE /api/auth/delete-account
 * Permanently delete the authenticated user's account and all associated data
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete user's data first (links, categories, etc.)
    // The database should have CASCADE deletes set up, but let's be explicit
    const { error: linksError } = await supabase
      .from("links")
      .delete()
      .eq("user_id", user.id);

    if (linksError) {
      console.error("Error deleting links:", linksError);
    }

    const { error: categoriesError } = await supabase
      .from("categories")
      .delete()
      .eq("user_id", user.id);

    if (categoriesError) {
      console.error("Error deleting categories:", categoriesError);
    }

    const { error: tokensError } = await supabase
      .from("api_tokens")
      .delete()
      .eq("user_id", user.id);

    if (tokensError) {
      console.error("Error deleting tokens:", tokensError);
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
    }

    // Delete the user from Supabase Auth using admin client
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/auth/delete-account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
