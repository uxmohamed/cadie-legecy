export type RecoverMode = "reset" | "resync" | "all";

export interface RecoverOptions {
  mode: RecoverMode;
  apply: boolean;
  limit: number | null;
  batchSize: number;
  sleepMs: number;
}

export interface BillingResetPayload {
  plan_tier: "starter";
  subscription_status: "inactive";
  billing_interval: null;
  current_period_end: null;
  cancel_at_period_end: false;
  support_amount_cents: null;
  updated_at: string;
}

const VALID_MODES: readonly RecoverMode[] = ["reset", "resync", "all"];
const DEFAULT_MODE: RecoverMode = "all";
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_SLEEP_MS = 200;

function parsePositiveInteger(raw: string, flag: string): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
}

function isRecoverMode(value: string): value is RecoverMode {
  return VALID_MODES.includes(value as RecoverMode);
}

export function parseRecoverOptions(argv: string[]): RecoverOptions {
  let mode: RecoverMode = DEFAULT_MODE;
  let apply = false;
  let limit: number | null = null;
  let batchSize = DEFAULT_BATCH_SIZE;
  let sleepMs = DEFAULT_SLEEP_MS;

  for (const arg of argv) {
    if (arg === "--apply") {
      apply = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      continue;
    }

    if (arg.startsWith("--mode=")) {
      const value = arg.split("=")[1];
      if (!isRecoverMode(value)) {
        throw new Error(`--mode must be one of: ${VALID_MODES.join(", ")}`);
      }
      mode = value;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      limit = parsePositiveInteger(arg.split("=")[1], "--limit");
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      batchSize = parsePositiveInteger(arg.split("=")[1], "--batch-size");
      continue;
    }

    if (arg.startsWith("--sleep-ms=")) {
      sleepMs = parsePositiveInteger(arg.split("=")[1], "--sleep-ms");
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    mode,
    apply,
    limit,
    batchSize,
    sleepMs,
  };
}

export function buildResetAccessPayload(updatedAtIso: string): BillingResetPayload {
  return {
    plan_tier: "starter",
    subscription_status: "inactive",
    billing_interval: null,
    current_period_end: null,
    cancel_at_period_end: false,
    support_amount_cents: null,
    updated_at: updatedAtIso,
  };
}

