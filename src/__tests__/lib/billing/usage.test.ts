import { getEntitlements } from "@/lib/billing/entitlements";
import { getSpaceAccess, getUsageSnapshot } from "@/lib/billing/usage";
import { createAdminClient } from "@/lib/supabase/server";

describe("billing usage", () => {
  const mockCreateAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns usage counts when queries succeed", async () => {
    let linksSelectCalls = 0;

    const from = jest.fn((table: string) => {
      if (table === "links") {
        linksSelectCalls += 1;

        const responseByCall: Record<number, { count: number; error: null }> = {
          1: { count: 120, error: null },
          2: { count: 12, error: null },
          3: { count: 6, error: null },
        };

        const response = responseByCall[linksSelectCalls];
        let eqCalls = 0;
        const chain = {
          eq: jest.fn(() => {
            eqCalls += 1;
            if (eqCalls >= (linksSelectCalls === 1 ? 2 : 3)) {
              return Promise.resolve(response);
            }
            return chain;
          }),
        };

        return {
          select: jest.fn(() => chain),
        };
      }

      if (table === "spaces") {
        const chain = {
          eq: jest.fn().mockResolvedValue({ count: 4, error: null }),
        };

        return {
          select: jest.fn(() => chain),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    mockCreateAdminClient.mockReturnValue({ from } as never);

    await expect(getUsageSnapshot("user_1")).resolves.toEqual({
      totalSavedItems: 120,
      spacesTotal: 4,
      imagesTotal: 12,
      documentsTotal: 6,
    });
  });

  it("throws when usage query errors (fail-closed)", async () => {
    let linksSelectCalls = 0;

    const from = jest.fn((table: string) => {
      if (table === "links") {
        linksSelectCalls += 1;
        let eqCalls = 0;
        const isFirstLinksCountQuery = linksSelectCalls === 1;
        const chain = {
          eq: jest.fn(() => {
            eqCalls += 1;
            if (eqCalls >= (isFirstLinksCountQuery ? 2 : 3)) {
              return Promise.resolve(
                isFirstLinksCountQuery
                  ? { count: null, error: { message: "database unavailable" } }
                  : { count: 0, error: null }
              );
            }
            return chain;
          }),
        };

        return {
          select: jest.fn(() => chain),
        };
      }

      if (table === "spaces") {
        const chain = {
          eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
        };

        return {
          select: jest.fn(() => chain),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    mockCreateAdminClient.mockReturnValue({ from } as never);

    await expect(getUsageSnapshot("user_1")).rejects.toThrow("Failed to fetch links usage: database unavailable");
  });

  it("returns unlocked and locked spaces based on maxSpaces", async () => {
    const from = jest.fn((table: string) => {
      if (table !== "spaces") {
        throw new Error(`Unexpected table: ${table}`);
      }

      const order = jest.fn().mockResolvedValue({
        data: [
          { id: "s1", sort_order: 0 },
          { id: "s2", sort_order: 1 },
          { id: "s3", sort_order: 2 },
          { id: "s4", sort_order: 3 },
        ],
        error: null,
      });
      const eq = jest.fn().mockReturnValue({ order });
      const select = jest.fn().mockReturnValue({ eq });

      return { select };
    });

    mockCreateAdminClient.mockReturnValue({ from } as never);

    const entitlements = getEntitlements("starter");
    const result = await getSpaceAccess("user_1", entitlements);

    expect(result.orderedSpaces.map((space) => space.id)).toEqual(["s1", "s2", "s3", "s4"]);
    expect(Array.from(result.unlockedSpaceIds)).toEqual(["s1", "s2", "s3"]);
    expect(Array.from(result.lockedSpaceIds)).toEqual(["s4"]);
  });

  it("throws when space-access query errors (fail-closed)", async () => {
    const from = jest.fn((table: string) => {
      if (table !== "spaces") {
        throw new Error(`Unexpected table: ${table}`);
      }

      const order = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "permission denied" },
      });
      const eq = jest.fn().mockReturnValue({ order });
      const select = jest.fn().mockReturnValue({ eq });

      return { select };
    });

    mockCreateAdminClient.mockReturnValue({ from } as never);

    await expect(getSpaceAccess("user_1", getEntitlements("starter"))).rejects.toThrow(
      "Failed to fetch space access: permission denied"
    );
  });
});
