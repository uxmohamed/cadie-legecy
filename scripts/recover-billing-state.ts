import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  buildResetAccessPayload,
  parseRecoverOptions,
  type RecoverMode,
  type RecoverOptions,
} from "../src/lib/billing/recover-billing-state";

type PlanTier = "starter" | "pro" | "believer";
type SubscriptionStatus = "inactive" | "active" | "past_due" | "canceled" | "expired";
type BillingSyncSource = "local_subscription_id" | "email_bootstrap" | "customer_bootstrap" | "none";
type BillingSyncReason =
  | "no_local_subscription"
  | "no_user_email"
  | "no_matching_subscription"
  | "unmapped_variant"
  | "lemon_error"
  | "database_error";

interface BillingRow {
  user_id: string;
  plan_tier: PlanTier;
  lemon_subscription_id: string | null;
}

interface AuthUserRef {
  id: string;
  email: string | null;
}

interface BillingSyncResult {
  synced: boolean;
  source: BillingSyncSource;
  reason?: BillingSyncReason;
  message?: string;
}

interface ResetStats {
  totalRows: number;
  nonStarterRows: number;
  withLemonSubscriptionId: number;
  withoutLemonSubscriptionId: number;
}

interface ResyncSummary {
  total: number;
  synced: number;
  failed: number;
  reasons: Record<BillingSyncReason, number>;
}

function printHelp() {
  console.log("Recover billing state after accidental mass-upgrade");
  console.log("Usage: pnpm ts-node scripts/recover-billing-state.ts [options]");
  console.log("Options:");
  console.log("  --mode=reset|resync|all  Recovery phase (default: all)");
  console.log("  --apply                  Persist changes (default: dry-run)");
  console.log("  --limit=N                Process first N users/rows");
  console.log("  --batch-size=N           Resync batch size (default: 50)");
  console.log("  --sleep-ms=N             Delay between batches in ms (default: 200)");
  console.log("  --help, -h               Show help");
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function hasHelpFlag(argv: string[]): boolean {
  return argv.includes("--help") || argv.includes("-h");
}

function createAdminSupabase(): SupabaseClient {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function ensureResyncEnv() {
  getRequiredEnv("LEMONSQUEEZY_API_KEY");
  getRequiredEnv("LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID");
  getRequiredEnv("LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID");
  getRequiredEnv("LEMONSQUEEZY_BELIEVER_YEARLY_VARIANT_ID");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createEmptyResyncSummary(): ResyncSummary {
  return {
    total: 0,
    synced: 0,
    failed: 0,
    reasons: {
      no_local_subscription: 0,
      no_user_email: 0,
      no_matching_subscription: 0,
      unmapped_variant: 0,
      lemon_error: 0,
      database_error: 0,
    },
  };
}

async function fetchBillingRows(
  supabase: SupabaseClient,
  limit: number | null
): Promise<BillingRow[]> {
  let query = supabase
    .from("user_billing")
    .select("user_id, plan_tier, lemon_subscription_id")
    .order("updated_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to query user_billing: ${error.message}`);
  }

  return (data || []) as BillingRow[];
}

function computeResetStats(rows: BillingRow[]): ResetStats {
  let nonStarterRows = 0;
  let withLemonSubscriptionId = 0;

  for (const row of rows) {
    if (row.plan_tier !== "starter") nonStarterRows += 1;
    if (row.lemon_subscription_id) withLemonSubscriptionId += 1;
  }

  return {
    totalRows: rows.length,
    nonStarterRows,
    withLemonSubscriptionId,
    withoutLemonSubscriptionId: rows.length - withLemonSubscriptionId,
  };
}

async function applyReset(
  supabase: SupabaseClient,
  rows: BillingRow[],
  limit: number | null
): Promise<void> {
  if (rows.length === 0) return;

  const payload = buildResetAccessPayload(new Date().toISOString());

  if (typeof limit === "number") {
    const userIds = rows.map((row) => row.user_id);
    const { error } = await supabase
      .from("user_billing")
      .update(payload)
      .in("user_id", userIds);

    if (error) {
      throw new Error(`Failed to reset limited billing rows: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase
    .from("user_billing")
    .update(payload)
    .not("user_id", "is", null);

  if (error) {
    throw new Error(`Failed to reset billing rows: ${error.message}`);
  }
}

async function runResetPhase(
  supabase: SupabaseClient,
  options: RecoverOptions
): Promise<void> {
  const rows = await fetchBillingRows(supabase, options.limit);
  const stats = computeResetStats(rows);

  console.log("[reset] stats");
  console.log(JSON.stringify(stats, null, 2));

  if (!options.apply) {
    console.log("[reset] dry-run only; re-run with --apply to persist changes.");
    return;
  }

  await applyReset(supabase, rows, options.limit);
  console.log(`[reset] applied to ${rows.length} row(s).`);
}

async function fetchAllAuthUsers(supabase: SupabaseClient, limit: number | null): Promise<AuthUserRef[]> {
  const users: AuthUserRef[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }

    const pageUsers = data.users || [];
    for (const user of pageUsers) {
      users.push({
        id: user.id,
        email: user.email ?? null,
      });
      if (typeof limit === "number" && users.length >= limit) {
        return users;
      }
    }

    if (pageUsers.length < perPage) break;
    page += 1;
  }

  return users;
}

async function preflightLemonConnectivity() {
  const mod = await import("../src/lib/billing/lemon-client");
  const { lemonRequest } = mod as {
    lemonRequest: (path: string) => Promise<Record<string, unknown>>;
  };

  await lemonRequest("/stores?page[size]=1");
}

async function runResyncPhase(
  supabase: SupabaseClient,
  options: RecoverOptions
): Promise<ResyncSummary> {
  ensureResyncEnv();
  await preflightLemonConnectivity();

  const users = await fetchAllAuthUsers(supabase, options.limit);
  const summary = createEmptyResyncSummary();
  summary.total = users.length;

  console.log(`[resync] users targeted: ${users.length}`);

  if (!options.apply) {
    console.log("[resync] dry-run only; no user records were updated.");
    return summary;
  }

  const mod = await import("../src/lib/billing/sync");
  const { syncSubscription } = mod as {
    syncSubscription: (userId: string, userEmail: string | null) => Promise<BillingSyncResult>;
  };

  for (let i = 0; i < users.length; i += options.batchSize) {
    const batch = users.slice(i, i + options.batchSize);
    const results = await Promise.all(
      batch.map(async (user) => {
        try {
          const result = await syncSubscription(user.id, user.email);
          return { user, result };
        } catch (error) {
          return {
            user,
            result: {
              synced: false,
              source: "none" as const,
              reason: "lemon_error" as const,
              message: error instanceof Error ? error.message : String(error),
            },
          };
        }
      })
    );

    for (const { user, result } of results) {
      if (result.synced) {
        summary.synced += 1;
      } else {
        summary.failed += 1;
        if (result.reason && result.reason in summary.reasons) {
          summary.reasons[result.reason] += 1;
        } else {
          summary.reasons.lemon_error += 1;
        }
      }

      console.log(
        `[resync] user=${user.id} email=${user.email ?? "<missing>"} synced=${result.synced} source=${result.source} reason=${result.reason ?? "none"}`
      );
    }

    if (i + options.batchSize < users.length) {
      await sleep(options.sleepMs);
    }
  }

  return summary;
}

function shouldRun(mode: RecoverMode, phase: "reset" | "resync"): boolean {
  return mode === "all" || mode === phase;
}

async function run() {
  const argv = process.argv.slice(2);
  if (hasHelpFlag(argv)) {
    printHelp();
    return;
  }

  const options = parseRecoverOptions(argv);
  const supabase = createAdminSupabase();

  console.log(`[run] mode=${options.mode} apply=${options.apply} limit=${options.limit ?? "none"} batch_size=${options.batchSize} sleep_ms=${options.sleepMs}`);

  if (shouldRun(options.mode, "reset")) {
    await runResetPhase(supabase, options);
  }

  let resyncSummary: ResyncSummary | null = null;
  if (shouldRun(options.mode, "resync")) {
    resyncSummary = await runResyncPhase(supabase, options);
    console.log("[resync] summary");
    console.log(JSON.stringify(resyncSummary, null, 2));
  }

  if (resyncSummary) {
    if (resyncSummary.reasons.database_error > 0) {
      throw new Error("Recovery completed with database_error results. Investigate and retry.");
    }

    if (options.apply && resyncSummary.total > 0 && resyncSummary.synced === 0 && resyncSummary.failed > 0) {
      throw new Error("Recovery completed with 0 successful resyncs; likely global Lemon auth/connectivity issue.");
    }
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

