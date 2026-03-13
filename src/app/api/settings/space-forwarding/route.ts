import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRequestContext } from "@/lib/auth-middleware";
import { requireTokenScopes } from "@/lib/api-tokens";
import {
  AUTO_FORWARDING_FIELDS,
  AUTO_FORWARDING_JOIN_OPERATORS,
  AUTO_FORWARDING_OPERATORS,
  type AutoForwardingCondition,
} from "@/features/spaces/types/auto-forwarding";

const MAX_FORWARDING_CONDITIONS = 25;

function sanitizeConditions(input: unknown, validSpaceIds?: Set<string>): AutoForwardingCondition[] {
  if (!Array.isArray(input)) return [];

  return input
    .slice(0, MAX_FORWARDING_CONDITIONS)
    .map((item): AutoForwardingCondition | null => {
      if (!item || typeof item !== "object") return null;

      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" && record.id.trim() ? record.id.trim() : crypto.randomUUID();
      const targetSpaceId = typeof record.targetSpaceId === "string" ? record.targetSpaceId.trim() : "";
      const field = typeof record.field === "string" ? record.field : "domain";
      const operator = typeof record.operator === "string" ? record.operator : "contains";
      const join = typeof record.join === "string" ? record.join : "OR";
      const rawValue = typeof record.value === "string" ? record.value : "";
      const value = rawValue.trim().slice(0, 120);

      if (!targetSpaceId || !value) return null;
      if (validSpaceIds && !validSpaceIds.has(targetSpaceId)) return null;
      if (!AUTO_FORWARDING_FIELDS.includes(field as (typeof AUTO_FORWARDING_FIELDS)[number])) return null;
      if (!AUTO_FORWARDING_OPERATORS.includes(operator as (typeof AUTO_FORWARDING_OPERATORS)[number])) return null;
      if (!AUTO_FORWARDING_JOIN_OPERATORS.includes(join as (typeof AUTO_FORWARDING_JOIN_OPERATORS)[number])) return null;

      return {
        id,
        targetSpaceId,
        field,
        operator,
        join,
        value,
      } as AutoForwardingCondition;
    })
    .filter((condition): condition is AutoForwardingCondition => Boolean(condition));
}

export async function GET(request: NextRequest) {
  const context = await createRequestContext(request);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const scopeError = requireTokenScopes(context, ["settings:read"]);
  if (scopeError) return scopeError;
  const userId = context.userId;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const preferences = (data?.preferences || {}) as Record<string, unknown>;
  const enabled = preferences.auto_space_forwarding !== false;

  const { data: spaces, error: spacesError } = await supabase
    .from("spaces")
    .select("id")
    .eq("user_id", userId);

  const validSpaceIds = spacesError ? undefined : new Set((spaces || []).map((space) => space.id));

  const conditions = sanitizeConditions(preferences.auto_space_forwarding_conditions, validSpaceIds);

  return NextResponse.json({ enabled, conditions });
}

export async function PATCH(request: NextRequest) {
  const context = await createRequestContext(request);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const scopeError = requireTokenScopes(context, ["settings:write"]);
  if (scopeError) return scopeError;
  const userId = context.userId;

  const body = (await request.json().catch(() => ({}))) as { enabled?: unknown; conditions?: unknown };

  if (body.enabled !== undefined && typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled must be a boolean when provided" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: current, error: readError } = await supabase
    .from("users")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  const currentPreferences = ((current?.preferences || {}) as Record<string, unknown>);
  const nextEnabled =
    typeof body.enabled === "boolean"
      ? body.enabled
      : currentPreferences.auto_space_forwarding !== false;

  const { data: spaces, error: spacesError } = await supabase
    .from("spaces")
    .select("id")
    .eq("user_id", userId);

  const validSpaceIds = spacesError ? undefined : new Set((spaces || []).map((space) => space.id));

  const conditions = sanitizeConditions(body.conditions, validSpaceIds);

  const preferences = {
    ...currentPreferences,
    auto_space_forwarding: nextEnabled,
    auto_space_forwarding_conditions: conditions,
  };

  let updateError: { message: string } | null = null;

  if (current) {
    const { error } = await supabase
      .from("users")
      .update({ preferences })
      .eq("id", userId);

    updateError = error;
  } else {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    if (!user?.email) {
      return NextResponse.json(
        { error: "Unable to persist settings because user email is unavailable" },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: user.email,
        display_name:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : null,
        preferences,
      });

    updateError = error;
  }

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ enabled: nextEnabled, conditions });
}
