import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface BillingCandidate {
  user_id: string;
  plan_tier: "starter" | "pro" | "believer";
  subscription_status: "inactive" | "active" | "past_due" | "canceled" | "expired";
  lemon_subscription_id: string | null;
  updated_at: string;
}

interface ScriptOptions {
  apply: boolean;
  limit: number | null;
}

interface SyncResult {
  synced: boolean;
  source: "local_subscription_id" | "email_bootstrap" | "customer_bootstrap" | "none";
  reason?: string;
  message?: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function parseScriptOptions(argv: string[]): ScriptOptions {
  let apply = false;
  let limit: number | null = null;

  for (const arg of argv) {
    if (arg === "--apply") {
      apply = true;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const raw = arg.split("=")[1];
      const parsed = Number(raw);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error("--limit must be a positive integer");
      }
      limit = parsed;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { apply, limit };
}

export function isBackfillCandidate(row: Pick<BillingCandidate, "plan_tier" | "subscription_status" | "lemon_subscription_id">): boolean {
  if (row.lemon_subscription_id) return false;
  const paidPlan = row.plan_tier === "pro" || row.plan_tier === "believer";
  const activeLike = row.subscription_status === "active" || row.subscription_status === "past_due" || row.subscription_status === "canceled";
  return paidPlan && activeLike;
}

function printHelp() {
  console.log("Backfill missing lemon_subscription_id for paid billing rows");
  console.log("Usage: pnpm ts-node scripts/backfill-missing-lemon-subscription-ids.ts [--apply] [--limit=N]");
  console.log("  --apply    Persist updates (default is dry-run)");
  console.log("  --limit=N  Process only N matching rows");
}

async function loadSyncSubscription(): Promise<(userId: string, email: string | null) => Promise<SyncResult>> {
  const mod = await import("../src/lib/billing/sync");
  return mod.syncSubscription as (userId: string, email: string | null) => Promise<SyncResult>;
}

async function fetchAllUsersEmailMap(
  supabase: SupabaseClient
): Promise<Map<string, string>> {
  const emailMap = new Map<string, string>();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to load auth users: ${error.message}`);
    }

    const users = data.users || [];
    for (const user of users) {
      if (user.id && user.email) {
        emailMap.set(user.id, user.email);
      }
    }

    if (users.length < perPage) break;
    page += 1;
  }

  return emailMap;
}

async function fetchCandidates(
  supabase: SupabaseClient,
  limit: number | null
): Promise<BillingCandidate[]> {
  let query = supabase
    .from("user_billing")
    .select("user_id, plan_tier, subscription_status, lemon_subscription_id, updated_at")
    .in("plan_tier", ["pro", "believer"])
    .in("subscription_status", ["active", "past_due", "canceled"])
    .is("lemon_subscription_id", null)
    .order("updated_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to query billing candidates: ${error.message}`);
  }

  const rows = (data || []) as BillingCandidate[];
  return rows.filter(isBackfillCandidate);
}

async function run() {
  const options = parseScriptOptions(process.argv.slice(2));
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const candidates = await fetchCandidates(supabase, options.limit);
  const emailMap = await fetchAllUsersEmailMap(supabase);

  console.log(`Mode: ${options.apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`Candidates: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log("No matching rows found.");
    return;
  }

  if (!options.apply) {
    for (const row of candidates) {
      const email = emailMap.get(row.user_id) || null;
      console.log(
        `[DRY-RUN] user=${row.user_id} plan=${row.plan_tier} status=${row.subscription_status} email=${email || "<missing>"} updated_at=${row.updated_at}`
      );
    }
    console.log("Dry-run complete. Re-run with --apply to perform sync.");
    return;
  }

  const syncSubscription = await loadSyncSubscription();

  const summary = {
    processed: 0,
    synced: 0,
    no_match: 0,
    no_email: 0,
    errors: 0,
  };

  for (const row of candidates) {
    summary.processed += 1;
    const email = emailMap.get(row.user_id) || null;

    try {
      const result = await syncSubscription(row.user_id, email);
      if (result.synced) {
        summary.synced += 1;
      } else if (result.reason === "no_user_email") {
        summary.no_email += 1;
      } else {
        summary.no_match += 1;
      }

      console.log(
        `[APPLY] user=${row.user_id} synced=${result.synced} source=${result.source} reason=${result.reason || "none"} message=${result.message || ""}`
      );
    } catch (error) {
      summary.errors += 1;
      console.error(
        `[APPLY] user=${row.user_id} failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  console.log("Summary:");
  console.log(JSON.stringify(summary, null, 2));
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
