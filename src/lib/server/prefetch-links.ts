import { createClient } from "@/lib/supabase/server";
import type { Link, LinkFilters } from "@/features/links/types";

/**
 * Initial page size for prefetching - balanced for performance and scrolling experience
 * Client can load more as user scrolls
 */
const INITIAL_PAGE_SIZE = 100;

/**
 * Server-side function to prefetch links for a user
 * Called from Server Components to pass initial data to client
 */
export async function prefetchLinks(
  userId: string,
  filters?: LinkFilters,
  limit: number = INITIAL_PAGE_SIZE
): Promise<{ links: Link[]; total: number }> {
  const supabase = await createClient();

  let query = supabase.from("links").select("*", { count: "exact" });

  query = query.eq("user_id", userId);

  // Apply filters
  if (filters?.category_id) {
    if (filters.category_id === "uncategorized") {
      query = query.is("category_id", null);
    } else if (filters.category_id !== "all") {
      query = query.eq("category_id", filters.category_id);
    }
  }

  if (filters?.is_archived !== undefined) {
    query = query.eq("is_archived", filters.is_archived);
  }

  if (filters?.is_deleted !== undefined) {
    query = query.eq("is_deleted", filters.is_deleted);
  } else {
    // Default to non-deleted links
    query = query.eq("is_deleted", false);
  }

  if (filters?.is_pinned !== undefined) {
    query = query.eq("is_pinned", filters.is_pinned);
  }

  // Apply sorting - pinned first, then by created_at
  query = query.order("is_pinned", { ascending: false });
  query = query.order("created_at", { ascending: false });

  // Apply limit
  query = query.limit(limit);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error prefetching links:", error);
    return { links: [], total: 0 };
  }

  return {
    links: (data as Link[]) || [],
    total: count || 0,
  };
}

/**
 * Prefetch links for the main dashboard (non-deleted, non-archived)
 */
export async function prefetchDashboardLinks(
  userId: string
): Promise<{ links: Link[]; total: number }> {
  return prefetchLinks(userId, { is_deleted: false, is_archived: false });
}

/**
 * Prefetch links for the trash view
 */
export async function prefetchTrashLinks(
  userId: string
): Promise<{ links: Link[]; total: number }> {
  return prefetchLinks(userId, { is_deleted: true });
}
