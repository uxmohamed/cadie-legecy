import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Determine the correct redirect URL
      const forwardedHost = request.headers.get("x-forwarded-host");
      const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
      
      let redirectUrl: string;
      
      // Priority: 1. Environment variable, 2. Forwarded host, 3. Origin
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}${next}`;
      } else if (forwardedHost) {
        redirectUrl = `${forwardedProto}://${forwardedHost}${next}`;
      } else {
        redirectUrl = `${origin}${next}`;
      }
      
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If there's an error or no code, redirect to auth page
  // Use the same logic for error redirects
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  
  let authUrl: string;
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    authUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth`;
  } else if (forwardedHost) {
    authUrl = `${forwardedProto}://${forwardedHost}/auth`;
  } else {
    authUrl = `${origin}/auth`;
  }
  
  return NextResponse.redirect(authUrl);
}

