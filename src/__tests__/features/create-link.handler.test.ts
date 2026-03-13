const mockCreateLink = jest.fn();
const mockRepositoryConstructor = jest.fn();
const mockGetBillingContext = jest.fn();
const mockGetIdempotentResponse = jest.fn();

jest.mock("next/server", () => {
  class MockNextResponse {
    status: number;
    headers: Headers;
    private readonly bodyData: unknown;

    constructor(body?: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.bodyData = body;
      this.status = init?.status ?? 200;
      this.headers = new Headers(init?.headers);
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(JSON.stringify(data), {
        status: init?.status,
        headers: {
          ...(init?.headers || {}),
          "content-type": "application/json",
        },
      });
    }

    async json() {
      if (typeof this.bodyData === "string") {
        return JSON.parse(this.bodyData);
      }
      return this.bodyData;
    }
  }

  return {
    NextResponse: MockNextResponse,
    after: jest.fn(),
  };
});

jest.mock("@/features/links/services", () => ({
  LinkService: jest.fn().mockImplementation(() => ({
    createLink: (...args: unknown[]) => mockCreateLink(...args),
  })),
}));

jest.mock("@/features/links/services/ai-tagging.service", () => ({
  AITaggingService: jest.fn(),
}));

jest.mock("@/features/links/repositories", () => ({
  SupabaseLinkRepository: jest.fn().mockImplementation((...args: unknown[]) => {
    mockRepositoryConstructor(...args);
    return {};
  }),
}));

jest.mock("@/lib/auth-middleware", () => ({
  createRequestContext: jest.fn(),
}));

jest.mock("@/lib/job-queue", () => ({
  enqueueMetadataEnrichment: jest.fn(),
  enqueueAITagging: jest.fn(),
  enqueueAIVisionTagging: jest.fn(),
}));

jest.mock("@/features/spaces/services/auto-space-forwarding.service", () => ({
  AutoSpaceForwardingService: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(),
}));

jest.mock("@/lib/metadata", () => ({
  extractMetadata: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  log: {
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("@/lib/billing/context", () => ({
  getBillingContext: (...args: unknown[]) => mockGetBillingContext(...args),
}));

jest.mock("@/lib/idempotency", () => ({
  getIdempotentResponse: (...args: unknown[]) => mockGetIdempotentResponse(...args),
  setIdempotentResponse: jest.fn(),
}));

import { CreateLinkHandler } from "@/features/links/api/handlers/create-link.handler";

describe("CreateLinkHandler privileged extension path", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIdempotentResponse.mockResolvedValue(null);
    mockGetBillingContext.mockResolvedValue({
      plan: "starter",
      entitlements: {
        maxSavedItems: null,
        maxImages: null,
        maxDocuments: null,
      },
      usage: {
        totalSavedItems: 0,
        imagesTotal: 0,
        documentsTotal: 0,
      },
    });
    mockCreateLink.mockResolvedValue({
      link: {
        id: "link_1",
        content_type: "note",
        url: "note://link",
      },
      isDuplicate: true,
      isRestored: false,
    });
  });

  it("uses the privileged repository path only for api_token extension requests", async () => {
    const handler = new CreateLinkHandler();

    await handler.handle(
      {
        headers: new Headers({ "x-cadie-source": "extension" }),
        nextUrl: new URL("http://localhost/api/links"),
      } as never,
      {
        url: "note://link",
        title: "Note",
        content_type: "note",
      },
      {
        userId: "user_1",
        authSource: "api_token",
        token: {
          id: "token_1",
          expiresAt: "2099-01-01T00:00:00Z",
          scopes: ["legacy_full_access"],
          clientId: "cadie-browser-extension",
          installId: "install_1",
        },
      }
    );

    expect(typeof mockRepositoryConstructor.mock.calls[0][0]).toBe("function");
  });

  it("keeps spoofed extension headers on the normal repository path for session requests", async () => {
    const handler = new CreateLinkHandler();

    await handler.handle(
      {
        headers: new Headers({ "x-cadie-source": "extension" }),
        nextUrl: new URL("http://localhost/api/links"),
      } as never,
      {
        url: "note://link",
        title: "Note",
        content_type: "note",
      },
      {
        userId: "user_1",
        authSource: "session",
        token: null,
      }
    );

    expect(mockRepositoryConstructor.mock.calls[0][0]).toBeUndefined();
  });

  it("returns completed processing state for non-async note saves", async () => {
    const handler = new CreateLinkHandler();

    const response = await handler.handle(
      {
        headers: new Headers(),
        nextUrl: new URL("http://localhost/api/links"),
      } as never,
      {
        url: "note://link",
        title: "Note",
        content_type: "note",
      },
      {
        userId: "user_1",
        authSource: "session",
        token: null,
      }
    );

    await expect(response.json()).resolves.toMatchObject({
      processing_state: "completed",
    });
  });
});
