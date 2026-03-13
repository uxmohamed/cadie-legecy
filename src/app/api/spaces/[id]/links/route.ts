import { NextRequest, NextResponse } from "next/server";
import { rateLimitSpaces, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { createRequestContext } from "@/lib/auth-middleware";
import { requireTokenScopes } from "@/lib/api-tokens";
import { getBillingContext } from "@/lib/billing/context";
import { createPlanLimitResponse } from "@/lib/billing/limit-response";
import type { PlanTier } from "@/lib/billing/types";
import { RequestDataAccess, RequestDataAccessError } from "@/lib/request-data";

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
    const [context, { id: spaceId }, body] = await Promise.all([
      createRequestContext(request),
      params,
      request.json() as Promise<AddLinksBody>,
    ]);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scopeError = requireTokenScopes(context, ["spaces:write"]);
    if (scopeError) return scopeError;

    const dataAccess = new RequestDataAccess(context);

    // Rate limiting (depends on userId)
    const identifier = getIdentifier(request, context.userId);
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

    // Block adding links to locked overflow spaces
    const lockedAccess = await getLockedSpaceAccess(context.userId);
    if (lockedAccess.lockedSpaceIds.has(spaceId)) {
      return createPlanLimitResponse({
        plan: lockedAccess.plan,
        limitKey: "locked_space",
        current: null,
        max: lockedAccess.maxSpaces,
        message: "This space is locked on your current plan. Upgrade to unlock all spaces.",
      });
    }

    const result = await dataAccess.addLinksToSpace(spaceId, link_ids, {
      skipBatchOwnershipCheck: singleLinkExtensionRequest,
    });

    if (result.duplicateOnly) {
      return NextResponse.json({
        success: true,
        message: "Some links were already in this space"
      });
    }

    return NextResponse.json({
      success: true,
      link_spaces: result.inserted
    });
  } catch (error) {
    if (error instanceof RequestDataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
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
    const [context, { id: spaceId }, body] = await Promise.all([
      createRequestContext(request),
      params,
      request.json() as Promise<RemoveLinksBody>,
    ]);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scopeError = requireTokenScopes(context, ["spaces:write"]);
    if (scopeError) return scopeError;

    const dataAccess = new RequestDataAccess(context);

    // Rate limiting (depends on userId)
    const identifier = getIdentifier(request, context.userId);
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

    // Block removing links from locked overflow spaces
    const lockedAccess = await getLockedSpaceAccess(context.userId);
    if (lockedAccess.lockedSpaceIds.has(spaceId)) {
      return createPlanLimitResponse({
        plan: lockedAccess.plan,
        limitKey: "locked_space",
        current: null,
        max: lockedAccess.maxSpaces,
        message: "This space is locked on your current plan. Upgrade to unlock all spaces.",
      });
    }

    await dataAccess.removeLinksFromSpace(spaceId, link_ids);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestDataAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error removing links from space:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
