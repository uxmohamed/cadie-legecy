import {
  isBackfillCandidate,
  parseScriptOptions,
} from "../../../scripts/backfill-missing-lemon-subscription-ids";

describe("backfill-missing-lemon-subscription-ids script helpers", () => {
  it("parses dry-run defaults", () => {
    expect(parseScriptOptions([])).toEqual({ apply: false, limit: null });
  });

  it("parses apply mode and limit", () => {
    expect(parseScriptOptions(["--apply", "--limit=25"])).toEqual({
      apply: true,
      limit: 25,
    });
  });

  it("throws on invalid limit", () => {
    expect(() => parseScriptOptions(["--limit=0"])).toThrow("--limit must be a positive integer");
  });

  it("matches paid active-like rows missing subscription ID", () => {
    expect(
      isBackfillCandidate({
        plan_tier: "pro",
        subscription_status: "active",
        lemon_subscription_id: null,
      })
    ).toBe(true);

    expect(
      isBackfillCandidate({
        plan_tier: "believer",
        subscription_status: "past_due",
        lemon_subscription_id: null,
      })
    ).toBe(true);
  });

  it("rejects non-candidates", () => {
    expect(
      isBackfillCandidate({
        plan_tier: "starter",
        subscription_status: "active",
        lemon_subscription_id: null,
      })
    ).toBe(false);

    expect(
      isBackfillCandidate({
        plan_tier: "pro",
        subscription_status: "expired",
        lemon_subscription_id: null,
      })
    ).toBe(false);

    expect(
      isBackfillCandidate({
        plan_tier: "pro",
        subscription_status: "active",
        lemon_subscription_id: "sub_123",
      })
    ).toBe(false);
  });
});
