/**
 * Tests for createPlanLimitResponse — the standardized HTTP 402 response builder.
 */

// Mock NextResponse since it requires Web Fetch API not available in Jest jsdom
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

import { buildPlanLimitPayload, createPlanLimitResponse } from "@/lib/billing/limit-response";

describe("buildPlanLimitPayload", () => {
  it("builds a correctly shaped payload for saved_items", () => {
    const payload = buildPlanLimitPayload({
      plan: "starter",
      limitKey: "saved_items",
      current: 100,
      max: 100,
      message: "Limit reached",
    });

    expect(payload.code).toBe("PLAN_LIMIT_REACHED");
    expect(payload.limit_key).toBe("saved_items");
    expect(payload.current).toBe(100);
    expect(payload.max).toBe(100);
    expect(payload.upgrade_required).toBe(true);
    expect(payload.plan).toBe("starter");
    expect(payload.message).toBe("Limit reached");
  });

  it("allows null current and max (for boolean gates like imports)", () => {
    const payload = buildPlanLimitPayload({
      plan: "starter",
      limitKey: "imports",
      current: null,
      max: null,
      message: "Import not available on starter",
    });

    expect(payload.current).toBeNull();
    expect(payload.max).toBeNull();
  });

  it("sets upgrade_required to true always", () => {
    const payload = buildPlanLimitPayload({
      plan: "starter",
      limitKey: "spaces",
      current: 3,
      max: 3,
      message: "msg",
    });
    expect(payload.upgrade_required).toBe(true);
  });
});

describe("createPlanLimitResponse", () => {
  it("returns a NextResponse with status 402 by default", async () => {
    const response = createPlanLimitResponse({
      plan: "starter",
      limitKey: "saved_items",
      current: 100,
      max: 100,
      message: "You have hit your limit",
    });

    expect(response.status).toBe(402);
    const body = await response.json();
    expect(body.code).toBe("PLAN_LIMIT_REACHED");
    expect(body.error).toBe("You have hit your limit");
    expect(body.limit_key).toBe("saved_items");
    expect(body.upgrade_required).toBe(true);
    expect(body.plan).toBe("starter");
  });

  it("accepts a custom status code", async () => {
    const response = createPlanLimitResponse(
      {
        plan: "starter",
        limitKey: "spaces",
        current: 3,
        max: 3,
        message: "Space limit reached",
      },
      403
    );
    expect(response.status).toBe(403);
  });

  it("includes all limit_key variants without error", () => {
    const keys = ["saved_items", "spaces", "locked_space", "images", "documents", "image_file_size", "document_file_size", "imports"] as const;
    for (const key of keys) {
      expect(() =>
        createPlanLimitResponse({
          plan: "starter",
          limitKey: key,
          current: 0,
          max: 0,
          message: "test",
        })
      ).not.toThrow();
    }
  });
});
