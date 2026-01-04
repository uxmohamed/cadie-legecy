"use client";

import { Zero } from "@rocicorp/zero";
import { schema, type Schema } from "./schema";

/**
 * Zero client instance
 * Created once and reused across the app
 */
let zeroInstance: Zero<Schema> | null = null;

/**
 * Get or create the Zero client instance
 * Zero handles local persistence via IndexedDB automatically
 */
export function getZero(userId: string): Zero<Schema> {
  // Return existing instance if it matches the user
  if (zeroInstance && zeroInstance.userID === userId) {
    return zeroInstance;
  }

  // Close existing instance if user changed
  if (zeroInstance) {
    zeroInstance.close();
    zeroInstance = null;
  }

  // Get the Zero server URL from environment
  const zeroServerUrl = process.env.NEXT_PUBLIC_ZERO_SERVER_URL;

  // Create new Zero instance
  zeroInstance = new Zero({
    schema,
    userID: userId,
    // Connect to Zero server if configured, otherwise use local-only mode
    server: zeroServerUrl || undefined,
    // Use IndexedDB for persistence (automatic in browser)
    kvStore: "idb",
  });

  return zeroInstance;
}

/**
 * Close the Zero client instance
 * Call this on user logout
 */
export function closeZero(): void {
  if (zeroInstance) {
    zeroInstance.close();
    zeroInstance = null;
  }
}

/**
 * Export the Zero type for use in hooks
 */
export type ZeroClient = Zero<Schema>;
