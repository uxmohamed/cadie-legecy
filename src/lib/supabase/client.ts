import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicEnv } from './env'

export function createClient() {
  const { url, key } = getSupabasePublicEnv()

  return createBrowserClient(
    url,
    key,
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
