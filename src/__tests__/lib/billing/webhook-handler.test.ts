import { processLemonWebhook } from "@/lib/billing/webhook-handler";
import { createAdminClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/lib/billing/plan-resolver", () => ({
  resolvePlanFromVariantId: jest.fn((id: string) => {
    if (id === "variant_pro_monthly") return "pro";
    if (id === "variant_pro_yearly") return "pro";
    if (id === "variant_believer") return "believer";
    return null;
  }),
}));

type EventStatus = "pending" | "processed" | "failed";

interface StoredEvent {
  id: number;
  event_id: string;
  provider_event_id: string | null;
  event_name: string;
  payload: Record<string, unknown>;
  processing_status: EventStatus;
  attempt_count: number;
  last_error: string | null;
  last_attempt_at: string | null;
  processed_at: string | null;
}

interface MockState {
  nextEventId: number;
  eventsByEventId: Map<string, StoredEvent>;
  eventsById: Map<number, StoredEvent>;
  billingByUserId: Map<string, Record<string, unknown>>;
  upsertPayloads: Record<string, unknown>[];
  upsertErrorQueue: Array<{ message: string } | null>;
}

function createState(): MockState {
  return {
    nextEventId: 1,
    eventsByEventId: new Map(),
    eventsById: new Map(),
    billingByUserId: new Map(),
    upsertPayloads: [],
    upsertErrorQueue: [],
  };
}

function createSupabaseMock(state: MockState) {
  return {
    from(table: string) {
      if (table === "billing_webhook_events") {
        return {
          select() {
            return {
              eq(field: string, value: unknown) {
                return {
                  async maybeSingle() {
                    if (field !== "event_id") return { data: null, error: null };
                    const row = state.eventsByEventId.get(String(value));
                    if (!row) return { data: null, error: null };
                    return {
                      data: {
                        id: row.id,
                        processing_status: row.processing_status,
                        attempt_count: row.attempt_count,
                      },
                      error: null,
                    };
                  },
                };
              },
            };
          },
          insert(payload: Record<string, unknown>) {
            return {
              select() {
                return {
                  async single() {
                    const eventId = String(payload.event_id);
                    if (state.eventsByEventId.has(eventId)) {
                      return { data: null, error: { code: "23505", message: "Duplicate key" } };
                    }

                    const row: StoredEvent = {
                      id: state.nextEventId++,
                      event_id: eventId,
                      provider_event_id:
                        typeof payload.provider_event_id === "string" ? payload.provider_event_id : null,
                      event_name: String(payload.event_name || "unknown"),
                      payload: (payload.payload || {}) as Record<string, unknown>,
                      processing_status: (payload.processing_status as EventStatus) || "pending",
                      attempt_count: Number(payload.attempt_count || 0),
                      last_error: null,
                      last_attempt_at: null,
                      processed_at: null,
                    };

                    state.eventsByEventId.set(eventId, row);
                    state.eventsById.set(row.id, row);

                    return {
                      data: {
                        id: row.id,
                        processing_status: row.processing_status,
                        attempt_count: row.attempt_count,
                      },
                      error: null,
                    };
                  },
                };
              },
            };
          },
          update(patch: Record<string, unknown>) {
            return {
              async eq(field: string, value: unknown) {
                if (field !== "id") return { error: { message: "Unsupported update filter" } };
                const row = state.eventsById.get(Number(value));
                if (!row) return { error: { message: "Webhook event row not found" } };
                Object.assign(row, patch);
                return { error: null };
              },
            };
          },
        };
      }

      if (table === "user_billing") {
        return {
          select() {
            return {
              eq(field: string, value: unknown) {
                return {
                  async maybeSingle() {
                    if (field === "user_id") {
                      const row = state.billingByUserId.get(String(value));
                      return { data: row || null, error: null };
                    }

                    if (field === "lemon_subscription_id") {
                      const row = [...state.billingByUserId.values()].find(
                        (candidate) => candidate.lemon_subscription_id === String(value)
                      );
                      return row
                        ? {
                            data: {
                              user_id: row.user_id,
                              plan_tier: row.plan_tier,
                            },
                            error: null,
                          }
                        : { data: null, error: null };
                    }

                    if (field === "lemon_customer_id") {
                      const row = [...state.billingByUserId.values()].find(
                        (candidate) => candidate.lemon_customer_id === String(value)
                      );
                      return row
                        ? {
                            data: {
                              user_id: row.user_id,
                              plan_tier: row.plan_tier,
                            },
                            error: null,
                          }
                        : { data: null, error: null };
                    }

                    return { data: null, error: null };
                  },
                };
              },
            };
          },
          async upsert(payload: Record<string, unknown>) {
            state.upsertPayloads.push(payload);
            const queued = state.upsertErrorQueue.shift();
            if (queued) {
              return { error: queued };
            }

            const userId = String(payload.user_id);
            const existing = state.billingByUserId.get(userId) || {};
            state.billingByUserId.set(userId, {
              ...existing,
              ...payload,
            });
            return { error: null };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

function makeSubscriptionPayload(overrides: Record<string, unknown> = {}) {
  const attrs = {
    customer_id: "cust_123",
    variant_id: "variant_pro_monthly",
    status: "active",
    billing_interval: "monthly",
    renews_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-02-22T10:00:00Z",
    ...overrides,
  };

  return {
    meta: {
      event_name: "subscription_created",
      webhook_id: "wh_123",
      custom_data: { user_id: "user_123" },
    },
    data: {
      id: "sub_123",
      type: "subscriptions",
      attributes: attrs,
    },
  };
}

describe("processLemonWebhook", () => {
  let state: MockState;

  beforeEach(() => {
    jest.clearAllMocks();
    state = createState();
    (createAdminClient as jest.Mock).mockReturnValue(createSupabaseMock(state));
  });

  it("processes subscription_created and marks the event as processed", async () => {
    const rawBody = JSON.stringify(makeSubscriptionPayload());
    const result = await processLemonWebhook(rawBody);

    expect(result).toEqual({ processed: true });
    expect(state.upsertPayloads).toHaveLength(1);
    expect(state.upsertPayloads[0]).toEqual(
      expect.objectContaining({
        user_id: "user_123",
        plan_tier: "pro",
        subscription_status: "active",
        billing_interval: "month",
      })
    );

    const event = [...state.eventsByEventId.values()][0];
    expect(event.processing_status).toBe("processed");
    expect(event.attempt_count).toBe(1);
  });

  it("ignores duplicate events that are already processed", async () => {
    const rawBody = JSON.stringify(makeSubscriptionPayload());
    const first = await processLemonWebhook(rawBody);
    const second = await processLemonWebhook(rawBody);

    expect(first).toEqual({ processed: true });
    expect(second).toEqual({ processed: true, ignored: true });
    expect(state.upsertPayloads).toHaveLength(1);
  });

  it("retries events that previously failed instead of dedupe-skipping", async () => {
    state.upsertErrorQueue.push({ message: "temporary DB failure" });
    const rawBody = JSON.stringify(makeSubscriptionPayload());

    await expect(processLemonWebhook(rawBody)).rejects.toThrow("temporary DB failure");

    const firstEvent = [...state.eventsByEventId.values()][0];
    expect(firstEvent.processing_status).toBe("failed");
    expect(firstEvent.attempt_count).toBe(1);

    const retry = await processLemonWebhook(rawBody);
    expect(retry).toEqual({ processed: true });

    const secondEvent = [...state.eventsByEventId.values()][0];
    expect(secondEvent.processing_status).toBe("processed");
    expect(secondEvent.attempt_count).toBe(2);
  });

  it("ignores stale events older than lemon_last_event_at", async () => {
    state.billingByUserId.set("user_123", {
      user_id: "user_123",
      plan_tier: "pro",
      lemon_subscription_id: "sub_123",
      lemon_customer_id: "cust_123",
      current_period_end: "2026-04-01T00:00:00Z",
      lemon_last_event_at: "2026-02-23T00:00:00Z",
    });

    const payload = makeSubscriptionPayload({
      updated_at: "2026-02-20T00:00:00Z",
    });
    const result = await processLemonWebhook(JSON.stringify(payload));

    expect(result).toEqual({ processed: true, ignored: true });
    expect(state.upsertPayloads).toHaveLength(0);
  });

  it("does not grant access from order_created in subscriptions-only mode", async () => {
    const payload = {
      meta: {
        event_name: "order_created",
        webhook_id: "wh_order_1",
        custom_data: { user_id: "user_123" },
      },
      data: {
        id: "order_123",
        type: "orders",
        attributes: {
          customer_id: "cust_123",
          first_order_item: { variant_id: "variant_believer" },
        },
      },
    };

    const result = await processLemonWebhook(JSON.stringify(payload));
    expect(result).toEqual({ processed: true, ignored: true });
    expect(state.upsertPayloads).toHaveLength(0);
  });

  it("revokes access immediately on refund event", async () => {
    const payload = {
      meta: {
        event_name: "order_refunded",
        webhook_id: "wh_refund_1",
        custom_data: { user_id: "user_123" },
      },
      data: {
        id: "sub_123",
        type: "subscriptions",
        attributes: {
          customer_id: "cust_123",
          variant_id: "variant_pro_monthly",
          updated_at: "2026-02-24T00:00:00Z",
        },
      },
    };

    const result = await processLemonWebhook(JSON.stringify(payload));
    expect(result).toEqual({ processed: true });
    expect(state.upsertPayloads[0]).toEqual(
      expect.objectContaining({
        user_id: "user_123",
        plan_tier: "starter",
        subscription_status: "expired",
      })
    );
  });

  it("ignores unmatched events when custom user id and Lemon IDs cannot map a user", async () => {
    const payload = {
      meta: {
        event_name: "subscription_created",
        webhook_id: "wh_unknown",
        custom_data: {},
      },
      data: {
        id: "sub_unknown",
        type: "subscriptions",
        attributes: {
          customer_id: "cust_unknown",
          variant_id: "variant_pro_monthly",
          status: "active",
          updated_at: "2026-02-22T12:00:00Z",
        },
      },
    };

    const result = await processLemonWebhook(JSON.stringify(payload));
    expect(result).toEqual({ processed: true, ignored: true });
    expect(state.upsertPayloads).toHaveLength(0);
  });
});
