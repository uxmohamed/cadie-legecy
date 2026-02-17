describe("job queue callback URL resolution", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  function loadModuleWithMockedClient() {
    const publishJSON = jest.fn().mockResolvedValue(undefined);

    jest.doMock("@upstash/qstash", () => ({
      Client: jest.fn().mockImplementation(() => ({ publishJSON })),
    }));

    process.env.QSTASH_TOKEN = "test-qstash-token";
    process.env.NEXT_PUBLIC_BASE_URL = "https://env-base.example/";

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jobQueue = require("@/lib/job-queue") as typeof import("@/lib/job-queue");
    return { jobQueue, publishJSON };
  }

  it("uses provided baseUrl override for metadata jobs", async () => {
    const { jobQueue, publishJSON } = loadModuleWithMockedClient();

    await jobQueue.enqueueMetadataEnrichment(
      {
        linkId: "link-123",
        url: "https://example.com/post",
        userId: "user-123",
      },
      { baseUrl: "https://origin.example/" }
    );

    expect(publishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://origin.example/api/jobs/enrich-metadata",
      })
    );
  });

  it("falls back to environment base URL when override is absent", async () => {
    const { jobQueue, publishJSON } = loadModuleWithMockedClient();

    await jobQueue.enqueueAITagging({
      linkId: "link-123",
      userId: "user-123",
    });

    expect(publishJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://env-base.example/api/jobs/enrich-ai-tags",
      })
    );
  });
});
