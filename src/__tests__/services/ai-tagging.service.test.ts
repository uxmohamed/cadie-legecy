import { AITaggingService } from "@/features/links/services/ai-tagging.service";

const mockOpenAICreate = jest.fn();
const mockGeminiGenerateContent = jest.fn();

interface VisionMessagePart {
  type: string;
  image_url?: {
    url: string;
  };
}

interface OpenAICreateCall {
  messages: Array<{
    content: string | VisionMessagePart[];
  }>;
}

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockOpenAICreate,
      },
    },
  }));
});

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGeminiGenerateContent,
    }),
  })),
}));

describe("AITaggingService", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("Network disabled")) as unknown as typeof fetch;
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("accepts and normalizes 3-word tags from OpenAI responses", async () => {
    process.env.GOOGLE_AI_API_KEY = "";
    process.env.OPENAI_API_KEY = "test-openai-key";

    mockOpenAICreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              tags: ["Machine Learning Model", "AI Research"],
              category: "article",
            }),
          },
        },
      ],
    });

    const service = new AITaggingService();
    const result = await service.generateTags({
      title: "Latest ML release",
      description: "A deep dive into model architecture updates",
    });

    expect(result).not.toBeNull();
    expect(result?.tags).toContain("machine-learning-model");
    expect(result?.category).toBe("article");
  });

  it("returns deterministic fallback tags for images when providers are unavailable", async () => {
    process.env.GOOGLE_AI_API_KEY = "";
    process.env.OPENAI_API_KEY = "";

    const service = new AITaggingService();
    const result = await service.generateTagsFromImage(
      "https://example.com/uploads/city-sunset-view.jpg"
    );

    expect(result).not.toBeNull();
    expect(result?.tags.length).toBeGreaterThan(0);
    expect(result?.description).toContain("Image item");
  });

  it("uses inline data URL for OpenAI vision when image fetch succeeds", async () => {
    process.env.GOOGLE_AI_API_KEY = "";
    process.env.OPENAI_API_KEY = "test-openai-key";

    const imageBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === "content-type") return "image/png";
          if (name === "content-length") return String(imageBytes.byteLength);
          return null;
        },
      },
      arrayBuffer: async () => imageBytes.buffer,
    }) as unknown as typeof fetch;

    mockOpenAICreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              tags: ["design", "branding"],
              category: "other",
              description: "A minimal logo treatment.",
            }),
          },
        },
      ],
    });

    const service = new AITaggingService();
    const result = await service.generateTagsFromImage(
      "https://example.com/uploads/logo.png"
    );

    expect(result).not.toBeNull();
    const callArgs = mockOpenAICreate.mock.calls[0]?.[0] as OpenAICreateCall;
    const userMessage = callArgs.messages[1];
    const messageContent = userMessage.content;

    expect(Array.isArray(messageContent)).toBe(true);

    const imagePart = (messageContent as VisionMessagePart[]).find(
      (part) => part.type === "image_url" && Boolean(part.image_url?.url)
    );

    expect(imagePart?.image_url?.url.startsWith("data:image/png;base64,")).toBe(
      true
    );
  });
});
