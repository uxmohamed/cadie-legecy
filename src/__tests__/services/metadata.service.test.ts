const mockExtractMetadata = jest.fn();
const mockCreateAdminClient = jest.fn();
const mockLog = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

jest.mock("@/lib/metadata", () => ({
  extractMetadata: (...args: unknown[]) => mockExtractMetadata(...args),
}));

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: () => mockCreateAdminClient(),
}));

jest.mock("@/lib/logger", () => ({
  log: mockLog,
}));

import { MetadataService } from "@/features/links/services/metadata.service";

type SelectResult = { data: Record<string, unknown> | null; error: { message: string } | null };

function createSelectChain(result: SelectResult) {
  const chain = {
    eq: jest.fn(() => chain),
    maybeSingle: jest.fn(async () => result),
  };

  return chain;
}

function createUpdateChain(
  values: Record<string, unknown>,
  calls: Array<{ values: Record<string, unknown>; filters: Array<[string, string, string]> }>,
  response: { error: { message: string } | null } = { error: null }
) {
  const record = {
    values,
    filters: [] as Array<[string, string, string]>,
  };
  calls.push(record);

  const chain = {
    error: response.error,
    eq: jest.fn((column: string, value: string) => {
      record.filters.push(["eq", column, value]);
      return chain;
    }),
    neq: jest.fn((column: string, value: string) => {
      record.filters.push(["neq", column, value]);
      return chain;
    }),
  };

  return chain;
}

function createSupabaseClient(
  selectResults: SelectResult[],
  updateCalls: Array<{ values: Record<string, unknown>; filters: Array<[string, string, string]> }>
) {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => createSelectChain(selectResults.shift() ?? { data: null, error: null })),
      update: jest.fn((values: Record<string, unknown>) => createUpdateChain(values, updateCalls)),
    })),
  };
}

describe("MetadataService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("publishes the full metadata payload on successful queued enrichment", async () => {
    const updateCalls: Array<{ values: Record<string, unknown>; filters: Array<[string, string, string]> }> = [];

    mockExtractMetadata.mockResolvedValue({
      domain: "example.com",
      title: "Queued Title",
      description: "Queued description",
      preview_image_url: "https://cdn.example.com/preview.png",
      favicon_url: "https://cdn.example.com/favicon.ico",
      site_name: "Example",
      final_url: "https://example.com/final",
      canonical_url: "https://example.com/canonical",
      content_text: "Queued content",
      preview_image_width: 1280,
      preview_image_height: 720,
      theme_color: "#112233",
      language: "en",
      word_count: 640,
      reading_time_minutes: 3,
      status_code: 200,
      fetch_status: "success",
      fetched_at: "2026-03-13T12:00:00.000Z",
      etag: "etag-789",
      last_modified: "Fri, 13 Mar 2026 12:00:00 GMT",
    });

    mockCreateAdminClient.mockReturnValue(
      createSupabaseClient(
        [
          {
            data: {
              id: "link_1",
              user_id: "user_1",
              url: "https://example.com/post",
              title: "example.com",
              description: null,
              domain: "example.com",
              site_name: null,
              content_text: null,
              og_image_url: null,
              favicon_url: null,
              final_url: null,
              canonical_url: null,
              favicon_variants: null,
              preview_image_width: null,
              preview_image_height: null,
              theme_color: null,
              language: null,
              word_count: null,
              reading_time_minutes: null,
              status_code: null,
              fetch_status: "pending",
              fetched_at: null,
              etag: null,
              last_modified: null,
            },
            error: null,
          },
        ],
        updateCalls
      )
    );

    const service = new MetadataService();
    const result = await service.enrichLink("link_1", "https://example.com/post", "url", "user_1");

    expect(result).toBe("success");
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]?.values).toMatchObject({
      title: "Queued Title",
      description: "Queued description",
      final_url: "https://example.com/final",
      canonical_url: "https://example.com/canonical",
      content_text: "Queued content",
      preview_image_width: 1280,
      preview_image_height: 720,
      theme_color: "#112233",
      language: "en",
      word_count: 640,
      reading_time_minutes: 3,
      status_code: 200,
      fetch_status: "success",
      etag: "etag-789",
      last_modified: "Fri, 13 Mar 2026 12:00:00 GMT",
    });
  });

  it("preserves a recovered success when a later queued refresh fails", async () => {
    const updateCalls: Array<{ values: Record<string, unknown>; filters: Array<[string, string, string]> }> = [];

    mockExtractMetadata.mockResolvedValue({
      domain: "example.com",
      title: "Example",
      fetch_status: "failed",
      fetched_at: "2026-03-13T12:05:00.000Z",
    });

    mockCreateAdminClient.mockReturnValue(
      createSupabaseClient(
        [
          {
            data: {
              id: "link_1",
              user_id: "user_1",
              url: "https://example.com/post",
              title: "Recovered Title",
              description: "Recovered description",
              domain: "example.com",
              site_name: "Example",
              content_text: "Recovered content",
              og_image_url: null,
              favicon_url: null,
              final_url: null,
              canonical_url: null,
              favicon_variants: null,
              preview_image_width: null,
              preview_image_height: null,
              theme_color: null,
              language: null,
              word_count: null,
              reading_time_minutes: null,
              status_code: null,
              fetch_status: "success",
              fetched_at: "2026-03-13T12:00:00.000Z",
              etag: null,
              last_modified: null,
            },
            error: null,
          },
        ],
        updateCalls
      )
    );

    const service = new MetadataService();
    const result = await service.enrichLink("link_1", "https://example.com/post", "url", "user_1");

    expect(result).toBe("success");
    expect(updateCalls).toHaveLength(0);
  });

  it("guards failure updates so a recovery win cannot be downgraded by a stale queued job", async () => {
    const updateCalls: Array<{ values: Record<string, unknown>; filters: Array<[string, string, string]> }> = [];

    mockExtractMetadata.mockResolvedValue({
      domain: "example.com",
      title: "Example",
      fetch_status: "timeout",
      fetched_at: "2026-03-13T12:05:00.000Z",
    });

    mockCreateAdminClient.mockReturnValue(
      createSupabaseClient(
        [
          {
            data: {
              id: "link_1",
              user_id: "user_1",
              url: "https://example.com/post",
              title: "example.com",
              description: null,
              domain: "example.com",
              site_name: null,
              content_text: null,
              og_image_url: null,
              favicon_url: null,
              final_url: null,
              canonical_url: null,
              favicon_variants: null,
              preview_image_width: null,
              preview_image_height: null,
              theme_color: null,
              language: null,
              word_count: null,
              reading_time_minutes: null,
              status_code: null,
              fetch_status: "pending",
              fetched_at: null,
              etag: null,
              last_modified: null,
            },
            error: null,
          },
          {
            data: {
              id: "link_1",
              user_id: "user_1",
              url: "https://example.com/post",
              title: "Recovered Title",
              description: "Recovered description",
              domain: "example.com",
              site_name: "Example",
              content_text: "Recovered content",
              og_image_url: null,
              favicon_url: null,
              final_url: null,
              canonical_url: null,
              favicon_variants: null,
              preview_image_width: null,
              preview_image_height: null,
              theme_color: null,
              language: null,
              word_count: null,
              reading_time_minutes: null,
              status_code: null,
              fetch_status: "success",
              fetched_at: "2026-03-13T12:04:30.000Z",
              etag: null,
              last_modified: null,
            },
            error: null,
          },
        ],
        updateCalls
      )
    );

    const service = new MetadataService();
    const result = await service.enrichLink("link_1", "https://example.com/post", "url", "user_1");

    expect(result).toBe("success");
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]?.values).toEqual({
      fetch_status: "timeout",
      fetched_at: "2026-03-13T12:05:00.000Z",
    });
    expect(updateCalls[0]?.filters).toContainEqual(["neq", "fetch_status", "success"]);
  });
});
