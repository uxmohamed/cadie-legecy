import { buildResetAccessPayload, parseRecoverOptions } from "@/lib/billing/recover-billing-state";

describe("recover-billing-state helpers", () => {
  test("uses safe defaults when no arguments are provided", () => {
    const options = parseRecoverOptions([]);

    expect(options).toEqual({
      mode: "all",
      apply: false,
      limit: null,
      batchSize: 50,
      sleepMs: 200,
    });
  });

  test("parses all supported flags", () => {
    const options = parseRecoverOptions([
      "--mode=resync",
      "--apply",
      "--limit=25",
      "--batch-size=10",
      "--sleep-ms=500",
    ]);

    expect(options).toEqual({
      mode: "resync",
      apply: true,
      limit: 25,
      batchSize: 10,
      sleepMs: 500,
    });
  });

  test("throws on invalid mode", () => {
    expect(() => parseRecoverOptions(["--mode=broken"])).toThrow(
      "--mode must be one of: reset, resync, all"
    );
  });

  test("throws on invalid numeric flags", () => {
    expect(() => parseRecoverOptions(["--limit=0"])).toThrow("--limit must be a positive integer");
    expect(() => parseRecoverOptions(["--batch-size=-1"])).toThrow(
      "--batch-size must be a positive integer"
    );
    expect(() => parseRecoverOptions(["--sleep-ms=abc"])).toThrow(
      "--sleep-ms must be a positive integer"
    );
  });

  test("builds reset payload without touching lemon linkage fields", () => {
    const payload = buildResetAccessPayload("2026-02-22T00:00:00.000Z");

    expect(payload).toEqual({
      plan_tier: "starter",
      subscription_status: "inactive",
      billing_interval: null,
      current_period_end: null,
      cancel_at_period_end: false,
      support_amount_cents: null,
      updated_at: "2026-02-22T00:00:00.000Z",
    });

    expect("lemon_customer_id" in payload).toBe(false);
    expect("lemon_subscription_id" in payload).toBe(false);
    expect("lemon_variant_id" in payload).toBe(false);
  });
});

