import { RequestDataAccess } from "@/lib/request-data";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth-middleware";

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(),
  createClient: jest.fn(),
}));

describe("RequestDataAccess", () => {
  const apiTokenContext: RequestContext = {
    userId: "user_1",
    authSource: "api_token",
    token: {
      id: "token_1",
      expiresAt: "2099-01-01T00:00:00Z",
      scopes: ["legacy_full_access"],
      clientId: "cadie-browser-extension",
      installId: "install_1",
    },
  };

  const mockCreateAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>;
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the admin client for api_token contexts while still scoping space reads to the user", async () => {
    const spacesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ id: "s1", name: "Work", color: "#111111" }],
        error: null,
      }),
    };

    mockCreateAdminClient.mockReturnValue({
      from: jest.fn(() => spacesQuery),
    } as never);

    const dataAccess = new RequestDataAccess(apiTokenContext);
    await expect(dataAccess.listSpacesLite()).resolves.toEqual([
      { id: "s1", name: "Work", color: "#111111" },
    ]);

    expect(mockCreateAdminClient).toHaveBeenCalledTimes(1);
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(spacesQuery.eq).toHaveBeenCalledWith("user_id", "user_1");
  });

  it("filters foreign space ids out of getLinkSpaceIds", async () => {
    const linksQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: "link_1" },
        error: null,
      }),
    };
    const linkSpacesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{ space_id: "s1" }, { space_id: "s2" }],
        error: null,
      }),
    };
    const spacesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [{ id: "s2" }],
        error: null,
      }),
    };

    mockCreateAdminClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === "links") return linksQuery;
        if (table === "link_spaces") return linkSpacesQuery;
        if (table === "spaces") return spacesQuery;
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as never);

    const dataAccess = new RequestDataAccess(apiTokenContext);
    await expect(dataAccess.getLinkSpaceIds("link_1")).resolves.toEqual(["s2"]);
  });

  it("filters selected space ids down to owned spaces in getLinkContext", async () => {
    const linksQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: "link_1" },
        error: null,
      }),
    };
    const spacesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          { id: "s1", name: "Work", color: "#111111" },
          { id: "s2", name: "Personal", color: "#222222" },
        ],
        error: null,
      }),
    };
    const linkSpacesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{ space_id: "s2" }, { space_id: "foreign_space" }],
        error: null,
      }),
    };

    mockCreateAdminClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === "links") return linksQuery;
        if (table === "spaces") return spacesQuery;
        if (table === "link_spaces") return linkSpacesQuery;
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as never);

    const dataAccess = new RequestDataAccess(apiTokenContext);
    await expect(dataAccess.getLinkContext("link_1")).resolves.toEqual({
      spaces: [
        { id: "s1", name: "Work", color: "#111111" },
        { id: "s2", name: "Personal", color: "#222222" },
      ],
      selectedSpaceIds: ["s2"],
    });
  });

  it("rejects addLinksToSpace when one or more links are not owned by the user", async () => {
    const spacesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: "space_1" },
        error: null,
      }),
    };
    const linksQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [{ id: "link_1" }],
        error: null,
      }),
    };

    mockCreateAdminClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === "spaces") return spacesQuery;
        if (table === "links") return linksQuery;
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as never);

    const dataAccess = new RequestDataAccess(apiTokenContext);

    await expect(dataAccess.addLinksToSpace("space_1", ["link_1", "link_2"])).rejects.toEqual(
      expect.objectContaining({
        message: "One or more links not found",
        status: 404,
      })
    );
  });
});
