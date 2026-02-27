import * as React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLinkMutations } from "@/features/links/queries/use-link-mutations";
import type { Link, LinkFilters } from "@/features/links/types";
import { queryKeys } from "@/lib/query/keys";

interface LinksResponse {
  links: Link[];
  total: number;
}

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

describe("useLinkMutations", () => {
  it("adds created links to the active space when adding from a space view", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false, gcTime: Infinity },
      },
    });

    const allFilters: LinkFilters = { is_deleted: false, is_archived: false };
    const spaceFilters: LinkFilters = {
      space_id: "11111111-1111-1111-1111-111111111111",
      is_deleted: false,
      is_archived: false,
    };

    queryClient.setQueryData<LinksResponse>(queryKeys.links.list(allFilters), {
      links: [],
      total: 0,
    });
    queryClient.setQueryData<LinksResponse>(queryKeys.links.list(spaceFilters), {
      links: [],
      total: 0,
    });

    const createdLink = makeLink({
      id: "new-link-1",
      url: "https://example.com/new",
      clean_url: "https://example.com/new",
      title: "https://example.com/new",
      created_at: "2026-02-27T10:00:00.000Z",
      updated_at: "2026-02-27T10:00:00.000Z",
      fetch_status: "success",
    });

    (global.fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/links/batch") {
        return {
          ok: true,
          json: async () => ({
            links: [createdLink],
            count: 1,
            restored: 0,
            duplicates: 0,
          }),
        };
      }

      if (url === `/api/spaces/${spaceFilters.space_id}/links`) {
        return {
          ok: true,
          json: async () => ({ success: true }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useLinkMutations(spaceFilters), { wrapper });

    act(() => {
      result.current.addLinks([{ value: "https://example.com/new", type: "url" }]);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/spaces/${spaceFilters.space_id}/links`,
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    const spaceCache = queryClient.getQueryData<LinksResponse>(
      queryKeys.links.list(spaceFilters)
    );
    expect(spaceCache?.links.some((link) => link.id === createdLink.id)).toBe(true);
    queryClient.clear();
  });
});
