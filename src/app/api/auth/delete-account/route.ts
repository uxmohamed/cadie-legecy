import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { rateLimitAccountDeletion, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";


/**
 * DELETE /api/auth/delete-account
 * Permanently delete the authenticated user's account and all associated data
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strict rate limiting for account deletion
    const identifier = getIdentifier(request, user.id);
    const { success, limit, reset, remaining } = await rateLimitAccountDeletion.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many deletion attempts. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    // Delete user's data first (links, spaces, link_spaces, etc.)
    // The database should have CASCADE deletes set up, but let's be explicit
    
    // Get user's link IDs first
    const { data: userLinks } = await supabase
      .from("links")
      .select("id")
      .eq("user_id", user.id);

    // Delete link_spaces entries for user's links
    if (userLinks && userLinks.length > 0) {
      const linkIds = userLinks.map(l => l.id);
      const { error: linkSpacesError } = await supabase
        .from("link_spaces")
        .delete()
        .in("link_id", linkIds);

      if (linkSpacesError) {
        console.error("Error deleting link_spaces:", linkSpacesError);
      }
    }

    // Delete spaces, links, tokens, and profile in parallel (all independent)
    const [spacesResult, linksResult, tokensResult, profileResult] = await Promise.all([
      supabase.from("spaces").delete().eq("user_id", user.id),
      supabase.from("links").delete().eq("user_id", user.id),
      supabase.from("api_tokens").delete().eq("user_id", user.id),
      supabase.from("profiles").delete().eq("id", user.id),
    ]);

    if (spacesResult.error) console.error("Error deleting spaces:", spacesResult.error);
    if (linksResult.error) console.error("Error deleting links:", linksResult.error);
    if (tokensResult.error) console.error("Error deleting tokens:", tokensResult.error);
    if (profileResult.error) console.error("Error deleting profile:", profileResult.error);

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
