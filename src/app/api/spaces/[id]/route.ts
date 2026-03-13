import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitSpaces, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { createRequestContext } from "@/lib/auth-middleware";
import { requireTokenScopes } from "@/lib/api-tokens";
import { getBillingContext } from "@/lib/billing/context";
import { createPlanLimitResponse } from "@/lib/billing/limit-response";

function isMissingSpacesDescriptionColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  return message.includes("'description' column of 'spaces'") || message.includes("column \"description\" of relation \"spaces\"");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request and use the resulting user id for ownership checks.
    const context = await createRequestContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scopeError = requireTokenScopes(context, ["spaces:write"]);
    if (scopeError) return scopeError;
    const userId = context.userId;

    const { id } = await params;

    // Rate limiting
    const identifier = getIdentifier(request, userId);
    const { success, limit, reset, remaining } = await rateLimitSpaces.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    interface UpdateSpaceBody {
      name?: string;
      color?: string;
      sort_order?: number;
      description?: string | null;
    }

    const body = (await request.json()) as UpdateSpaceBody;
    const { name, color, sort_order, description } = body;

    // Verify space belongs to user
    const supabase = await createClient();
    const { data: existingSpace, error: fetchError } = await supabase
      .from("spaces")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingSpace) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }

    // Block mutations on locked overflow spaces
    const billingCtx = await getBillingContext(userId);
    if (
      sort_order !== undefined &&
      billingCtx.entitlements.maxSpaces !== null &&
      billingCtx.usage.spacesTotal > billingCtx.entitlements.maxSpaces
    ) {
      return createPlanLimitResponse({
        plan: billingCtx.plan,
        limitKey: "locked_space",
        current: null,
        max: billingCtx.entitlements.maxSpaces,
        message: "Reordering spaces is unavailable on your current plan while you have locked spaces.",
      });
    }

    if (billingCtx.lockedSpaceIds.has(id)) {
      return createPlanLimitResponse({
        plan: billingCtx.plan,
        limitKey: "locked_space",
        current: null,
        max: billingCtx.entitlements.maxSpaces,
        message: "This space is locked on your current plan. Upgrade to unlock all spaces.",
      });
    }

    // Build update object
    const updateData: { name?: string; color?: string; sort_order?: number; description?: string | null } = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (description !== undefined) updateData.description = typeof description === "string" ? description.trim().slice(0, 240) : null;

    let { data, error } = await supabase
      .from("spaces")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error && updateData.description !== undefined && isMissingSpacesDescriptionColumn(error)) {
      const fallbackUpdateData = { ...updateData };
      delete fallbackUpdateData.description;
      ({ data, error } = await supabase
        .from("spaces")
        .update(fallbackUpdateData)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single());
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ space: { ...data, description: data?.description ?? null } });
  } catch (error) {
    console.error("Error updating space:", error);
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
    // Authenticate the request and use the resulting user id for ownership checks.
    const context = await createRequestContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scopeError = requireTokenScopes(context, ["spaces:write"]);
    if (scopeError) return scopeError;
    const userId = context.userId;

    const { id } = await params;

    // Rate limiting
    const identifier = getIdentifier(request, userId);
    const { success, limit, reset, remaining } = await rateLimitSpaces.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(limit, remaining, reset) }
      );
    }

    // Verify space belongs to user
    const supabase = await createClient();
    const { data: existingSpace, error: fetchError } = await supabase
      .from("spaces")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingSpace) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }

    // Block deletion of locked overflow spaces
    const billingCtxDel = await getBillingContext(userId);
    if (billingCtxDel.lockedSpaceIds.has(id)) {
      return createPlanLimitResponse({
        plan: billingCtxDel.plan,
        limitKey: "locked_space",
        current: null,
        max: billingCtxDel.entitlements.maxSpaces,
        message: "This space is locked on your current plan. Upgrade to manage all spaces.",
      });
    }

    // Delete space (CASCADE will handle link_spaces)
    const { error } = await supabase
      .from("spaces")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting space:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
