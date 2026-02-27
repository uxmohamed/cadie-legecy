import { AutoSpaceForwardingService } from "@/features/spaces/services/auto-space-forwarding.service";

function createMockSupabaseClient() {
  const insertedMemberships: Array<{ link_id: string; space_id: string }> = [];

  const client = {
    from(table: string) {
      if (table === "users") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async single() {
            return {
              data: {
                preferences: {
                  auto_space_forwarding: true,
                  auto_space_forwarding_conditions: [
                    {
                      id: "rule-1",
                      targetSpaceId: "space-target",
                      field: "domain",
                      operator: "equals",
                      value: "example.com",
                      join: "AND",
                    },
                  ],
                },
              },
            };
          },
        };
      }

      if (table === "spaces") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async order() {
            return {
              data: [
                { id: "space-primary", name: "Inbox", description: null, sort_order: 0 },
                { id: "space-target", name: "Examples", description: null, sort_order: 1 },
              ],
              error: null,
            };
          },
        };
      }

      if (table === "link_spaces") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async maybeSingle() {
            return { data: null };
          },
          async insert(payload: { link_id: string; space_id: string }) {
            insertedMemberships.push(payload);
            return { error: null };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return { client, insertedMemberships };
}

describe("AutoSpaceForwardingService", () => {
  it("supports an injected data client for stateless extension saves", async () => {
    const { client, insertedMemberships } = createMockSupabaseClient();
    const getSupabaseClient = jest.fn().mockResolvedValue(client);
    const service = new AutoSpaceForwardingService(getSupabaseClient);

    const result = await service.forwardLinks("user-1", [
      {
        id: "link-1",
        url: "https://example.com/article",
        domain: "example.com",
        title: "Example article",
      },
    ]);

    expect(getSupabaseClient).toHaveBeenCalled();
    expect(insertedMemberships).toEqual([
      {
        link_id: "link-1",
        space_id: "space-target",
      },
    ]);
    expect(result.forwardedByLinkId["link-1"]).toBe("Examples");
    expect(result.forwardedSpaceNames).toEqual(["Examples"]);
  });
});
