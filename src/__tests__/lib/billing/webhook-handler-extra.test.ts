/**
 * Additional webhook handler tests covering signature verification,
 * status/interval mapping, and edge cases not in the main test file.
 */

import {
  verifyLemonWebhookSignature,
  mapStatus,
  mapInterval,
} from "@/lib/billing/webhook-handler";
import { createHmac } from "node:crypto";

// ─── Signature Verification ──────────────────────────────────────────────────

describe("verifyLemonWebhookSignature", () => {
  const secret = "test_webhook_secret";
  const body = JSON.stringify({ meta: { event_name: "subscription_created" } });

  beforeEach(() => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = secret;
  });

  afterEach(() => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  });

  it("returns true for a valid HMAC-SHA256 signature", () => {
    const validSig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyLemonWebhookSignature(body, validSig)).toBe(true);
  });

  it("returns false for a tampered body", () => {
    const validSig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyLemonWebhookSignature(body + " ", validSig)).toBe(false);
  });

  it("returns false for a wrong signature", () => {
    expect(verifyLemonWebhookSignature(body, "deadbeef")).toBe(false);
  });

  it("returns false when signature is null", () => {
    expect(verifyLemonWebhookSignature(body, null)).toBe(false);
  });

  it("returns false when LEMONSQUEEZY_WEBHOOK_SECRET is not set", () => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const validSig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyLemonWebhookSignature(body, validSig)).toBe(false);
  });
});

// ─── Status Mapping ──────────────────────────────────────────────────────────

describe("mapStatus", () => {
  it("maps 'active' payload status to 'active'", () => {
    expect(mapStatus("active", "subscription_updated")).toBe("active");
  });

  it("maps 'on_trial' to 'active'", () => {
    expect(mapStatus("on_trial", "subscription_updated")).toBe("active");
  });

  it("maps 'past_due' to 'past_due'", () => {
    expect(mapStatus("past_due", "subscription_updated")).toBe("past_due");
  });

  it("maps 'unpaid' to 'unpaid'", () => {
    expect(mapStatus("unpaid", "subscription_updated")).toBe("unpaid");
  });

  it("maps 'paused' to 'paused'", () => {
    expect(mapStatus("paused", "subscription_updated")).toBe("paused");
  });

  it("maps 'cancelled' to 'canceled'", () => {
    expect(mapStatus("cancelled", "subscription_cancelled")).toBe("canceled");
  });

  it("forces 'canceled' for subscription_cancelled event when status is missing", () => {
    expect(mapStatus(undefined, "subscription_cancelled")).toBe("canceled");
  });

  it("forces 'active' for subscription_unpaused event when status is missing", () => {
    expect(mapStatus(undefined, "subscription_unpaused")).toBe("active");
  });

  it("maps 'expired' to 'expired'", () => {
    expect(mapStatus("expired", "subscription_updated")).toBe("expired");
  });

  it("forces 'expired' status for subscription_expired event regardless of payload", () => {
    expect(mapStatus("active", "subscription_expired")).toBe("expired");
  });

  it("forces 'past_due' status for subscription_payment_failed event", () => {
    expect(mapStatus("active", "subscription_payment_failed")).toBe("past_due");
  });

  it("returns 'inactive' for unknown status strings", () => {
    expect(mapStatus("unknown_status", "subscription_updated")).toBe("inactive");
  });

  it("is case-insensitive for payload status", () => {
    expect(mapStatus("ACTIVE", "subscription_updated")).toBe("active");
  });
});

// ─── Interval Mapping ────────────────────────────────────────────────────────

describe("mapInterval", () => {
  it("maps 'month' to 'month'", () => {
    expect(mapInterval("month")).toBe("month");
  });

  it("maps 'monthly' to 'month'", () => {
    expect(mapInterval("monthly")).toBe("month");
  });

  it("maps 'year' to 'year'", () => {
    expect(mapInterval("year")).toBe("year");
  });

  it("maps 'yearly' to 'year'", () => {
    expect(mapInterval("yearly")).toBe("year");
  });

  it("maps 'annually' to 'year'", () => {
    expect(mapInterval("annually")).toBe("year");
  });

  it("returns null for null input", () => {
    expect(mapInterval(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(mapInterval(undefined)).toBeNull();
  });

  it("returns null for unknown interval string", () => {
    expect(mapInterval("weekly")).toBeNull();
  });
});
