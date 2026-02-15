import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  const userId = await authenticateRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("preferences")
    .eq("id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const preferences = (data?.preferences || {}) as Record<string, unknown>;
  const enabled = preferences.auto_space_forwarding !== false;

  return NextResponse.json({ enabled });
}

export async function PATCH(request: NextRequest) {
  const userId = await authenticateRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { enabled?: boolean };

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: current, error: readError } = await supabase
    .from("users")
    .select("preferences")
    .eq("id", userId)
    .single();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  const preferences = {
    ...((current?.preferences || {}) as Record<string, unknown>),
    auto_space_forwarding: body.enabled,
  };

  const { error: updateError } = await supabase
    .from("users")
    .update({ preferences })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ enabled: body.enabled });
}
