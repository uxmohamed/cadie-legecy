/**
 * Shared type definitions
 */

import type { Database } from "@/lib/supabase/types";

/**
 * Category type with count
 * Extends the database Row type with a count property
 */
export type Category = Database["public"]["Tables"]["categories"]["Row"] & {
  count: number;
};
