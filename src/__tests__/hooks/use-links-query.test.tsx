import * as React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLinksQuery } from "@/features/links/queries/use-links-query";
import type { Link } from "@/features/links/types";

function makeLink(overrides: Partial<Link> = {}): Link {
  return {
    id: overrides.id ?? "link-1",
    user_id: overrides.user_id ?? "user-1",
    url: overrides.url ?? "https://example.com",
    clean_url: overrides.clean_url ?? "https://example.com",
    title: overrides.title ?? "Example",
    domain: overrides.domain ?? "example.com",
    content_type: overrides.content_type ?? "url",
    content_text: overrides.content_text ?? null,
    color_value: overrides.color_value ?? null,
    favicon_url: overrides.favicon_url ?? null,
    og_image_url: overrides.og_image_url ?? null,
    description: overrides.description ?? null,
    notes: overrides.notes ?? null,
    ai_summary: overrides.ai_summary ?? null,
    ai_tags: overrides.ai_tags ?? null,
    ai_key_themes: overrides.ai_key_themes ?? null,
    ai_quotes: overrides.ai_quotes ?? null,
    ai_facts: overrides.ai_facts ?? null,
    ai_people: overrides.ai_people ?? null,
    is_pinned: overrides.is_pinned ?? false,
    is_archived: overrides.is_archived ?? false,
    is_deleted: overrides.is_deleted ?? false,
    deleted_at: overrides.deleted_at ?? null,
    is_favorite: overrides.is_favorite ?? false,
    read_at: overrides.read_at ?? null,
    sort_order: overrides.sort_order ?? 0,
    created_at: overrides.created_at ?? "2026-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-01-01T00:00:00.000Z",
    final_url: overrides.final_url ?? null,
    canonical_url: overrides.canonical_url ?? null,
    site_name: overrides.site_name ?? null,
    favicon_variants: overrides.favicon_variants ?? null,
    preview_image_width: overrides.preview_image_width ?? null,
    preview_image_height: overrides.preview_image_height ?? null,
    theme_color: overrides.theme_color ?? null,
    language: overrides.language ?? null,
    word_count: overrides.word_count ?? null,
    reading_time_minutes: overrides.reading_time_minutes ?? null,
    status_code: overrides.status_code ?? null,
    fetch_status: overrides.fetch_status ?? "success",
    fetched_at: overrides.fetched_at ?? null,
    etag: overrides.etag ?? null,
    last_modified: overrides.last_modified ?? null,
  };
}

describe("useLinksQuery", () => {
  it("bypasses the browser HTTP cache for list fetches", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        links: [makeLink()],
        total: 1,
      }),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useLinksQuery({ is_deleted: false, is_archived: false }, true),
      { wrapper }
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/links?is_deleted=false&is_archived=false&limit=100&offset=0",
        expect.objectContaining({
          cache: "no-store",
          signal: expect.any(Object),
        })
      );
    });

    await waitFor(() => {
      expect(result.current.links).toHaveLength(1);
    });

    queryClient.clear();
  });
});
