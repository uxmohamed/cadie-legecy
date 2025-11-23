import { PostHog } from "posthog-node";

/**
 * Server-side PostHog client for use in API routes and server components.
 *
 * Important: Always call `await posthog.shutdown()` after using the client
 * to ensure events are flushed before the serverless function terminates.
 *
 * @example
 * ```typescript
 * const posthog = PostHogClient();
 * posthog.capture({
 *   distinctId: 'user_id',
 *   event: 'server_event',
 *   properties: { key: 'value' }
 * });
 * await posthog.shutdown();
 * ```
 */
export function PostHogClient() {
  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
  return posthogClient;
}
