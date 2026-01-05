/**
 * Shared type definitions
 */

import type { Database } from "@/lib/supabase/types";

/**
 * Space type with count
 * Extends the database Row type with a count property
 */
export type Space = Database["public"]["Tables"]["spaces"]["Row"] & {
  count?: number;
};
