import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { log } from '@/lib/logger'
import { getSupabasePublicEnv, hasSupabasePublicEnv } from '@/lib/supabase/env'

export async function middleware(request: NextRequest) {
  // Check if environment variables are available
  if (!hasSupabasePublicEnv()) {
    log.warn('Supabase environment variables not set, skipping auth proxy')
    return NextResponse.next({
      request,
    })
  }

  try {
    const { url, key } = getSupabasePublicEnv()

    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      url,
      key,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh session if expired - required for Server Components
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Allow auth callback to process
    if (request.nextUrl.pathname === '/auth/callback') {
      return supabaseResponse
    }

    // Protected routes (except root, changelog, auth pages, theme-debug, button-debug, typography-debug, terms, privacy, homepage, and onboarding-debug)
    const publicRoutes = ['/', '/changelog', '/theme-debug', '/button-debug', '/typography-debug', '/terms', '/privacy', '/homepage', '/onboarding-debug', '/tokens', '/settings-preview']
    const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname) ||
      request.nextUrl.pathname.startsWith('/auth') ||
      request.nextUrl.pathname.startsWith('/api')

    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      return NextResponse.redirect(url)
    }

    // Redirect to home if authenticated and trying to access auth page
    if (user && request.nextUrl.pathname.startsWith('/auth')) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    // If proxy fails, log error but allow request to proceed
    log.error('Proxy error', error, { path: request.nextUrl.pathname })
    return NextResponse.next({
      request,
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (images, videos, fonts, etc.)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|mp3|wav|woff|woff2|ttf|eot)$).*)',
  ],
}
