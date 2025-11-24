/**
 * Barrel export for database clients
 */
export { createClient as createServerClient } from "./server";
export { createClient as createBrowserClient } from "./client";
export type * from "./types";
