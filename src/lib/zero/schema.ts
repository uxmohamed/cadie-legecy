/**
 * Zero Schema Definition
 * 
 * This schema defines the data structure for Zero sync.
 * Zero enables local-first data with instant reads from IndexedDB
 * and background sync with the server.
 * 
 * Note: Zero requires a Zero Cache server to be deployed.
 * For now, we use server-side prefetching with SWR for fast initial loads.
 * This schema is prepared for future Zero integration.
 */

import {
  createSchema,
  table,
  string,
  boolean,
  number,
} from "@rocicorp/zero";

/**
 * Links table schema matching Supabase links table
 * Only includes columns needed for display and filtering
 */
const linksTable = table("links")
  .columns({
    id: string(),
    user_id: string(),
    url: string(),
    clean_url: string(),
    title: string(),
    domain: string(),
    content_type: string(),
    color_value: string().optional(),
    favicon_url: string().optional(),
    og_image_url: string().optional(),
    description: string().optional(),
    is_pinned: boolean(),
    is_archived: boolean(),
    is_deleted: boolean(),
    deleted_at: string().optional(),
    is_favorite: boolean(),
    sort_order: number(),
    created_at: string(),
    updated_at: string(),
    fetch_status: string(),
    fetched_at: string().optional(),
  })
  .primaryKey("id");

/**
 * Spaces table schema for organizing links
 */
const spacesTable = table("spaces")
  .columns({
    id: string(),
    user_id: string(),
    name: string(),
    color: string(),
    sort_order: number(),
    created_at: string(),
    updated_at: string(),
  })
  .primaryKey("id");

/**
 * Link-Spaces junction table for many-to-many relationship
 */
const linkSpacesTable = table("link_spaces")
  .columns({
    id: string(),
    link_id: string(),
    space_id: string(),
    created_at: string(),
  })
  .primaryKey("id");

/**
 * Create the Zero schema with all tables
 */
export const schema = createSchema({
  tables: [linksTable, spacesTable, linkSpacesTable],
});

/**
 * Define permissions - users can only access their own data
 * Zero enforces this at the sync layer
 * 
 * Note: Permissions are defined separately and require Zero Cache server.
 * This is a placeholder for future implementation.
 */
export const permissions = null; // TODO: Configure when Zero Cache is deployed

/**
 * Export types for the schema
 */
export type Schema = typeof schema;
