import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { syncSubscription } from "@/lib/billing/sync";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 250;
const MAX_LIMIT = 1000;

function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let result = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    result |= ca ^ cb;
  }
  return result === 0;
}

function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.round(parsed)));
}

function parseBoolean(raw: string | null): boolean {
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || ""}`;
    if (!process.env.CRON_SECRET || !timingSafeEqual(authHeader, expectedAuth)) {
      log.warn("Unauthorized billing reconcile cron access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
    const dryRun = parseBoolean(request.nextUrl.searchParams.get("dry_run"));
    const startedAt = new Date().toISOString();
    const supabase = createAdminClient();

    const { data: billingRows, error: billingError } = await supabase
      .from("user_billing")
      .select("user_id, plan_tier, subscription_status")
      .or(
        [
          "plan_tier.eq.pro",
          "plan_tier.eq.believer",
          "subscription_status.eq.active",
          "subscription_status.eq.past_due",
          "subscription_status.eq.canceled",
          "subscription_status.eq.paused",
          "subscription_status.eq.unpaid",
        ].join(",")
      )
      .limit(limit);

    if (billingError) {
      return NextResponse.json(
        { error: `Failed to load billing rows: ${billingError.message}` },
        { status: 500 }
      );
    }

    const rows = Array.isArray(billingRows) ? billingRows : [];
    const userIds = [...new Set(rows.map((row) => String(row.user_id)))];
    const emailByUserId = new Map<string, string | null>();

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, email")
        .in("id", userIds);

      if (usersError) {
        return NextResponse.json(
          { error: `Failed to load user emails: ${usersError.message}` },
          { status: 500 }
        );
      }

      for (const user of users || []) {
        emailByUserId.set(String(user.id), typeof user.email === "string" ? user.email : null);
      }
    }

    const summary = {
      scanned: rows.length,
      synced: 0,
      unchanged: 0,
      failed: 0,
      unmapped: 0,
      no_email: 0,
      dry_run: dryRun,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    };

    if (dryRun) {
      return NextResponse.json({
        success: true,
        ...summary,
      });
    }

    for (const row of rows) {
      const userId = String(row.user_id);
      const email = emailByUserId.get(userId) ?? null;
      const result = await syncSubscription(userId, email);

      if (result.synced) {
        summary.synced += 1;
      } else {
        const reason = result.reason || "no_matching_subscription";
        if (reason === "no_user_email") {
          summary.no_email += 1;
          summary.unchanged += 1;
        } else if (reason === "no_mapped_candidate" || reason === "unmapped_variant") {
          summary.unmapped += 1;
          summary.unchanged += 1;
        } else if (reason === "database_error" || reason === "lemon_error") {
          summary.failed += 1;
        } else {
          summary.unchanged += 1;
        }
      }
    }

    summary.completed_at = new Date().toISOString();
    log.info("Billing reconcile cron completed", summary);

    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    log.error("Billing reconcile cron failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Billing reconcile failed" },
      { status: 500 }
    );
  }
}
