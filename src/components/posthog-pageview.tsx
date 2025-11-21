'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize PostHog on the client side
    if (typeof window !== 'undefined') {
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

      if (!key) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY is not set. Analytics will not be tracked.');
        }
        return;
      }

      // Initialize PostHog if not already initialized
      if (!posthog.__loaded) {
        posthog.init(key, {
          api_host: host || 'https://eu.i.posthog.com',
          defaults: '2025-05-24',
          loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('[PostHog] Initialized successfully');
            }
          },
        });
      }
    }
  }, []);

  // Track pageviews
  useEffect(() => {
    if (pathname && posthog.__loaded) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
