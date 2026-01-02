import posthog from 'posthog-js';
import * as Sentry from "@sentry/nextjs";

// Initialize Sentry
Sentry.init({
  dsn: "https://d0afe93c896e40d3b153d78c72a2db68@o4510641831280640.ingest.us.sentry.io/4510641836326912",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  sendDefaultPii: true,
});

// Export router transition handler for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Initialize PostHog
if (typeof window !== 'undefined') {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY is not set. Analytics will not be tracked.');
    }
  } else {
    posthog.init(key, {
      api_host: host || 'https://eu.i.posthog.com',
      defaults: '2025-05-24'
    });
  }
}
