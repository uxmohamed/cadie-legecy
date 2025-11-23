import posthog from "posthog-js";

if (typeof window !== "undefined") {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[PostHog] NEXT_PUBLIC_POSTHOG_KEY is not set. Analytics will not be tracked.",
      );
    }
  } else {
    posthog.init(key, {
      api_host: host || "https://eu.i.posthog.com",
      defaults: "2025-05-24",
    });
  }
}
