import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rateLimitAccountDeletion, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";


/**
 * DELETE /api/auth/delete-account
 * Permanently delete the authenticated user's account and all associated data
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
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

    // Delete user's data first (before deleting auth user)
    // Use service role to bypass RLS and guarantee cleanup
    
    // Get user's link IDs first
    const { data: userLinks, error: userLinksError } = await supabaseAdmin
      .from("links")
      .select("id")
      .eq("user_id", user.id);

    if (userLinksError) {
      console.error("Error fetching user links:", userLinksError);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    // Delete link_spaces and link_tags entries for user's links first
    if (userLinks && userLinks.length > 0) {
      const linkIds = userLinks.map(l => l.id);
      const [linkSpacesResult, linkTagsResult] = await Promise.all([
        supabaseAdmin
          .from("link_spaces")
          .delete()
          .in("link_id", linkIds),
        supabaseAdmin
          .from("link_tags")
          .delete()
          .in("link_id", linkIds),
      ]);

      if (linkSpacesResult.error || linkTagsResult.error) {
        if (linkSpacesResult.error) {
          console.error("Error deleting link_spaces:", linkSpacesResult.error);
        }
        if (linkTagsResult.error) {
          console.error("Error deleting link_tags:", linkTagsResult.error);
        }
        return NextResponse.json(
          { error: "Failed to delete account" },
          { status: 500 }
        );
      }
    }

    // Delete remaining user-owned data in parallel
    const [spacesResult, linksResult, tokensResult, billingResult, jobsResult, userResult] = await Promise.all([
      supabaseAdmin.from("spaces").delete().eq("user_id", user.id),
      supabaseAdmin.from("links").delete().eq("user_id", user.id),
      supabaseAdmin.from("api_tokens").delete().eq("user_id", user.id),
      supabaseAdmin.from("user_billing").delete().eq("user_id", user.id),
      supabaseAdmin.from("bookmark_import_jobs").delete().eq("user_id", user.id),
      supabaseAdmin.from("users").delete().eq("id", user.id),
    ]);

    if (spacesResult.error || linksResult.error || tokensResult.error || billingResult.error || jobsResult.error || userResult.error) {
      if (spacesResult.error) console.error("Error deleting spaces:", spacesResult.error);
      if (linksResult.error) console.error("Error deleting links:", linksResult.error);
      if (tokensResult.error) console.error("Error deleting tokens:", tokensResult.error);
      if (billingResult.error) console.error("Error deleting user_billing:", billingResult.error);
      if (jobsResult.error) console.error("Error deleting bookmark_import_jobs:", jobsResult.error);
      if (userResult.error) console.error("Error deleting user:", userResult.error);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

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
