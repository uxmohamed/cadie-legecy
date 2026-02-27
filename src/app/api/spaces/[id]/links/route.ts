import { NextRequest, NextResponse } from "next/server";
import { createDataClientForRequest } from "@/lib/supabase/server";
import { rateLimitSpaces, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth-middleware";
import { getBillingContext } from "@/lib/billing/context";
import { createPlanLimitResponse } from "@/lib/billing/limit-response";
import type { PlanTier } from "@/lib/billing/types";

const LOCKED_SPACE_CACHE_TTL_MS = 30_000;
const EXTENSION_SOURCE_HEADER = "x-cadie-source";
const EXTENSION_SOURCE_VALUE = "extension";

type LockedSpaceCacheEntry = {
  expiresAt: number;
  plan: PlanTier;
  maxSpaces: number | null;
  lockedSpaceIds: Set<string>;
};

const lockedSpaceCache = new Map<string, LockedSpaceCacheEntry>();

function isExtensionRequest(request: NextRequest): boolean {
  return request.headers.get(EXTENSION_SOURCE_HEADER)?.toLowerCase() === EXTENSION_SOURCE_VALUE;
}

async function getLockedSpaceAccess(userId: string): Promise<LockedSpaceCacheEntry> {
  const cached = lockedSpaceCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const billingCtx = await getBillingContext(userId);
  const entry: LockedSpaceCacheEntry = {
    expiresAt: Date.now() + LOCKED_SPACE_CACHE_TTL_MS,
    plan: billingCtx.plan,
    maxSpaces: billingCtx.entitlements.maxSpaces,
    lockedSpaceIds: billingCtx.lockedSpaceIds,
  };
  lockedSpaceCache.set(userId, entry);
  return entry;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    interface AddLinksBody {
      link_ids: string[];
    }

    // Parallelize independent async operations
    const [userId, { id: spaceId }, body] = await Promise.all([
      authenticateRequest(request),
      params,
      request.json() as Promise<AddLinksBody>,
    ]);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting (depends on userId)
    const identifier = getIdentifier(request, userId);
    const { success, limit, reset, remaining } = await rateLimitSpaces.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    const { link_ids } = body;

    if (!link_ids || !Array.isArray(link_ids) || link_ids.length === 0) {
      return NextResponse.json(
        { error: "link_ids array is required" },
        { status: 400 }
      );
    }

    const singleLinkExtensionRequest = isExtensionRequest(request) && link_ids.length === 1;

    // Verify space belongs to user and optionally validate full link set.
    const supabase = await createDataClientForRequest(request);
    const [spaceResult, linksResult] = await Promise.all([
      supabase
        .from("spaces")
        .select("id")
        .eq("id", spaceId)
        .eq("user_id", userId)
        .single(),
      singleLinkExtensionRequest
        ? Promise.resolve({ data: null, error: null })
        : supabase
            .from("links")
            .select("id")
            .eq("user_id", userId)
            .in("id", link_ids),
    ]);

    if (spaceResult.error || !spaceResult.data) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }

    // Block adding links to locked overflow spaces
    const lockedAccess = await getLockedSpaceAccess(userId);
    if (lockedAccess.lockedSpaceIds.has(spaceId)) {
      return createPlanLimitResponse({
        plan: lockedAccess.plan,
        limitKey: "locked_space",
        current: null,
        max: lockedAccess.maxSpaces,
        message: "This space is locked on your current plan. Upgrade to unlock all spaces.",
      });
    }

    if (singleLinkExtensionRequest) {
      const singleLinkId = link_ids[0];
      const { data: singleLink, error: singleLinkError } = await supabase
        .from("links")
        .select("id")
        .eq("id", singleLinkId)
        .eq("user_id", userId)
        .maybeSingle();

      if (singleLinkError) {
        return NextResponse.json(
          { error: singleLinkError.message },
          { status: 500 }
        );
      }

      if (!singleLink) {
        return NextResponse.json(
          { error: "One or more links not found" },
          { status: 404 }
        );
      }
    } else {
      if (linksResult.error) {
        return NextResponse.json(
          { error: linksResult.error.message },
          { status: 500 }
        );
      }

      if (!linksResult.data || linksResult.data.length !== link_ids.length) {
        return NextResponse.json(
          { error: "One or more links not found" },
          { status: 404 }
        );
      }
    }

    // Insert link_spaces (ignore duplicates)
    const linkSpacesToInsert = link_ids.map(linkId => ({
      link_id: linkId,
      space_id: spaceId,
    }));

    const { data, error } = await supabase
      .from("link_spaces")
      .insert(linkSpacesToInsert)
      .select();

    if (error) {
      // Ignore unique constraint violations (link already in space)
      if (error.code === "23505") {
        return NextResponse.json({ 
          success: true,
          message: "Some links were already in this space"
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      link_spaces: data 
    });
  } catch (error) {
    console.error("Error adding links to space:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    interface RemoveLinksBody {
      link_ids: string[];
    }

    // Parallelize independent async operations
    const [userId, { id: spaceId }, body] = await Promise.all([
      authenticateRequest(request),
      params,
      request.json() as Promise<RemoveLinksBody>,
    ]);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting (depends on userId)
    const identifier = getIdentifier(request, userId);
    const { success, limit, reset, remaining } = await rateLimitSpaces.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    const { link_ids } = body;

    if (!link_ids || !Array.isArray(link_ids) || link_ids.length === 0) {
      return NextResponse.json(
        { error: "link_ids array is required" },
        { status: 400 }
      );
    }

    // Verify space belongs to user
    const supabase = await createDataClientForRequest(request);
    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("id")
      .eq("id", spaceId)
      .eq("user_id", userId)
      .single();

    if (spaceError || !space) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }

    // Block removing links from locked overflow spaces
    const lockedAccess = await getLockedSpaceAccess(userId);
    if (lockedAccess.lockedSpaceIds.has(spaceId)) {
      return createPlanLimitResponse({
        plan: lockedAccess.plan,
        limitKey: "locked_space",
        current: null,
        max: lockedAccess.maxSpaces,
        message: "This space is locked on your current plan. Upgrade to unlock all spaces.",
      });
    }

    // Delete link_spaces
    const { error } = await supabase
      .from("link_spaces")
      .delete()
      .eq("space_id", spaceId)
      .in("link_id", link_ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing links from space:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
