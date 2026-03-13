import {
  buildQueuedMetadataFailureUpdates,
  buildQueuedMetadataSuccessUpdates,
  buildRecoveryMetadataUpdates,
} from "@/features/links/lib/enrichment-ownership";

describe("enrichment ownership rules", () => {
  const metadata = {
    domain: "example.com",
    title: "Example Article",
    description: "Fresh metadata description",
    preview_image_url: "https://cdn.example.com/preview.png",
    favicon_url: "https://cdn.example.com/favicon.ico",
    site_name: "Example",
    final_url: "https://example.com/final",
    canonical_url: "https://example.com/canonical",
    content_text: "Full extracted content",
    favicon_variants: [{ url: "https://cdn.example.com/icon-32.png", sizes: "32x32" }],
    preview_image_width: 1200,
    preview_image_height: 630,
    theme_color: "#123456",
    language: "en",
    word_count: 450,
    reading_time_minutes: 2,
    status_code: 200,
    fetch_status: "success" as const,
    fetched_at: "2026-03-13T12:00:00.000Z",
    etag: "etag-123",
    last_modified: "Fri, 13 Mar 2026 12:00:00 GMT",
  };

  it("keeps extension recovery in backfill-only mode", () => {
    const updates = buildRecoveryMetadataUpdates(
      {
        url: "https://example.com/post",
        title: "example.com",
        domain: "example.com",
        description: "Existing description",
        og_image_url: null,
        favicon_url: "https://existing.example.com/favicon.ico",
        site_name: null,
        content_text: null,
        final_url: "https://existing.example.com/final",
        canonical_url: null,
        favicon_variants: [{ url: "https://existing.example.com/icon.png" }],
        preview_image_width: null,
        preview_image_height: null,
        theme_color: null,
        language: "en",
        word_count: null,
        reading_time_minutes: null,
        status_code: null,
        fetch_status: "pending",
        fetched_at: null,
        etag: null,
        last_modified: null,
      },
      metadata
    );

    expect(updates).toMatchObject({
      fetch_status: "success",
      fetched_at: "2026-03-13T12:00:00.000Z",
      title: "Example Article",
      og_image_url: "https://cdn.example.com/preview.png",
      site_name: "Example",
      canonical_url: "https://example.com/canonical",
      content_text: "Full extracted content",
      preview_image_width: 1200,
      preview_image_height: 630,
      theme_color: "#123456",
      word_count: 450,
      reading_time_minutes: 2,
      status_code: 200,
      etag: "etag-123",
      last_modified: "Fri, 13 Mar 2026 12:00:00 GMT",
    });
    expect(updates).not.toHaveProperty("description");
    expect(updates).not.toHaveProperty("favicon_url");
    expect(updates).not.toHaveProperty("final_url");
    expect(updates).not.toHaveProperty("favicon_variants");
    expect(updates).not.toHaveProperty("language");
  });

  it("lets queued metadata publish the full authoritative payload", () => {
    const updates = buildQueuedMetadataSuccessUpdates(metadata);

    expect(updates).toMatchObject({
      title: "Example Article",
      description: "Fresh metadata description",
      og_image_url: "https://cdn.example.com/preview.png",
      favicon_url: "https://cdn.example.com/favicon.ico",
      site_name: "Example",
      final_url: "https://example.com/final",
      canonical_url: "https://example.com/canonical",
      content_text: "Full extracted content",
      preview_image_width: 1200,
      preview_image_height: 630,
      theme_color: "#123456",
      language: "en",
      word_count: 450,
      reading_time_minutes: 2,
      status_code: 200,
      fetch_status: "success",
      fetched_at: "2026-03-13T12:00:00.000Z",
      etag: "etag-123",
      last_modified: "Fri, 13 Mar 2026 12:00:00 GMT",
    });
  });

  it("prevents failed queued refreshes from downgrading a resolved link", () => {
    expect(
      buildQueuedMetadataFailureUpdates(
        { fetch_status: "success" },
        { fetch_status: "failed", fetched_at: "2026-03-13T12:05:00.000Z" }
      )
    ).toBeNull();

    expect(
      buildQueuedMetadataFailureUpdates(
        { fetch_status: "pending" },
        { fetch_status: "failed", fetched_at: "2026-03-13T12:05:00.000Z" }
      )
    ).toEqual({
      fetch_status: "failed",
      fetched_at: "2026-03-13T12:05:00.000Z",
    });
  });
});
