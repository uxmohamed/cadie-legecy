import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getSupabasePublicEnv } from './env'

export async function createClient() {
  const cookieStore = await cookies()
  const { url, key } = getSupabasePublicEnv()

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Log cookie errors for debugging
            console.error('[SUPABASE COOKIES] Failed to set cookies:', error);
            // Don't throw - this is expected in API routes
          }
        },
      },
    }
  )
}

/**
 * Cached auth user getter - deduplicates getUser() calls within a single request.
 * Use this in server components and generateMetadata to avoid redundant auth checks.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});

/**
 * Create a Supabase client with Service Role privileges
 * WARNING: access controls are bypassed. Use with caution.
 */
export function createAdminClient() {
  const { url } = getSupabasePublicEnv()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.')
  }

  return createSupabaseClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
