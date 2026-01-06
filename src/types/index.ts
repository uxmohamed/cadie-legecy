/**
 * Shared type definitions
 */

import type { Database } from "@/lib/supabase/types";

/**
 * Space type with link count
 * Extends the database Row type with a link_count property
 */
export type Space = Database["public"]["Tables"]["spaces"]["Row"] & {
  link_count: number;
};

/**
 * Category type with count (deprecated - use Space instead)
 * @deprecated Use Space type instead. Categories have been replaced by Spaces.
 * This type is kept for backward compatibility but the categories table no longer exists.
 */
export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  count: number;
};
