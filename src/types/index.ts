/**
 * Shared type definitions
 */

import type { Database } from "@/lib/supabase/types";

/**
 * Space type with link count
 * Extends the database Row type with a link_count property
 */
export type Space = Database["public"]["Tables"]["spaces"]["Row"] & {
  link_count?: number;
};
