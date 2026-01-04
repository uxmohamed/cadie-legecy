import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractMetadata } from "@/lib/metadata";
import { rateLimitMetadata, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";


export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(request, user.id);
    const { success: rateLimitSuccess, limit, reset, remaining } = await rateLimitMetadata.limit(identifier);
    
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: getRateLimitHeaders(limit, remaining, reset)
        }
      );
    }

    interface MetadataBody {
      url: string;
    }

    const body = (await request.json()) as MetadataBody;
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const metadata = await extractMetadata(url);

    return NextResponse.json({ metadata });
  } catch (error) {
    console.error("Error extracting metadata:", error);
    return NextResponse.json(
      { error: "Failed to extract metadata" },
      { status: 500 }
    );
  }
}

