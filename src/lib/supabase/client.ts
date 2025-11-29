import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        // Configure Realtime for better Cloudflare compatibility
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  )
}
