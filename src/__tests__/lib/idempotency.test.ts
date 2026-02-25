import { getIdempotentResponse, setIdempotentResponse } from "@/lib/idempotency";

describe("idempotency cache", () => {
  it("stores and retrieves a cached response", async () => {
    await setIdempotentResponse("links:create", "user-1", "abc123", {
      status: 201,
      body: { ok: true, value: 42 },
    });

    const cached = await getIdempotentResponse("links:create", "user-1", "abc123");
    expect(cached).not.toBeNull();
    expect(cached?.status).toBe(201);
    expect(cached?.body).toEqual({ ok: true, value: 42 });
  });

  it("returns null when key is missing", async () => {
    const cached = await getIdempotentResponse("links:create", "user-1", "missing-key");
    expect(cached).toBeNull();
  });
});
