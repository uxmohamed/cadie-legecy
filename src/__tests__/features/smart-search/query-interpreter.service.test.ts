import { QueryInterpreterService } from "@/features/search/services/query-interpreter.service";

const mockOpenAICreate = jest.fn();

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockOpenAICreate,
      },
    },
  }));
});

describe("QueryInterpreterService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("parses markdown-fenced JSON payloads", async () => {
    mockOpenAICreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content:
              "```json\n{\"rewrittenQuery\":\"yesterday\",\"chips\":[{\"kind\":\"date\",\"preset\":\"yesterday\"}]}\n```",
          },
        },
      ],
    });

    const service = new QueryInterpreterService();
    const result = await service.interpretQuery({
      query: "yesterday",
      timezone: "UTC",
      currentScope: { selectedCategoryId: null },
      spaces: [],
    });

    expect(result.mode).toBe("smart");
    if (result.mode === "smart") {
      expect(result.plan.chips[0].kind).toBe("date");
    }
  });

  it("normalizes content-type synonyms like pdf -> document", async () => {
    mockOpenAICreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              rewrittenQuery: "documents",
              chips: [{ kind: "type", value: "pdf" }],
            }),
          },
        },
      ],
    });

    const service = new QueryInterpreterService();
    const result = await service.interpretQuery({
      query: "my pdfs",
      timezone: "UTC",
      currentScope: { selectedCategoryId: null },
      spaces: [],
    });

    expect(result.mode).toBe("smart");
    if (result.mode === "smart") {
      expect(result.plan.chips[0]).toMatchObject({ kind: "content_type", value: "document" });
    }
  });

  it("normalizes shorthand like imgs -> image chip", async () => {
    mockOpenAICreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              rewrittenQuery: "images",
              chips: [{ kind: "content_type", value: "imgs" }],
            }),
          },
        },
      ],
    });

    const service = new QueryInterpreterService();
    const result = await service.interpretQuery({
      query: "imgs",
      timezone: "UTC",
      currentScope: { selectedCategoryId: null },
      spaces: [],
    });

    expect(result.mode).toBe("smart");
    if (result.mode === "smart") {
      expect(result.plan.rewrittenQuery).toBe("images");
      expect(result.plan.chips[0]).toMatchObject({ kind: "content_type", value: "image" });
    }
  });

  it("normalizes source/platform variants", async () => {
    mockOpenAICreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              rewrittenQuery: "twitter posts",
              chips: [{ kind: "platform", source: "twitter", domain: "x.com" }],
            }),
          },
        },
      ],
    });

    const service = new QueryInterpreterService();
    const result = await service.interpretQuery({
      query: "twitter posts",
      timezone: "UTC",
      currentScope: { selectedCategoryId: null },
      spaces: [],
    });

    expect(result.mode).toBe("smart");
    if (result.mode === "smart") {
      expect(result.plan.chips[0]).toMatchObject({ kind: "source", sourceId: "twitter" });
    }
  });

  it("adds a fallback keyword chip when AI returns no chips", async () => {
    mockOpenAICreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              rewrittenQuery: "portfolio links",
              chips: [],
            }),
          },
        },
      ],
    });

    const service = new QueryInterpreterService();
    const result = await service.interpretQuery({
      query: "Portfolio links",
      timezone: "UTC",
      currentScope: { selectedCategoryId: null },
      spaces: [],
    });

    expect(result.mode).toBe("smart");
    if (result.mode === "smart") {
      expect(result.plan.chips).toHaveLength(1);
      expect(result.plan.chips[0]).toMatchObject({ kind: "keyword", term: "portfolio" });
    }
  });
});
