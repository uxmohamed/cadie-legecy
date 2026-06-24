import * as React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSync } from "@/features/links/hooks/use-realtime-sync.hook";
import { queryKeys } from "@/lib/query/keys";
import type { Link, LinkFilters } from "@/features/links/types";

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
    fetch_status: overrides.fetch_status ?? "pending",
    fetched_at: overrides.fetched_at ?? null,
    etag: overrides.etag ?? null,
    last_modified: overrides.last_modified ?? null,
  };
}

describe("useRealtimeSync", () => {
  function renderRealtimeHook(queryClient: QueryClient) {
    const handlers: Array<(payload: unknown) => void> = [];
    let statusHandler: ((status: string) => void) | null = null;
    const channel = {
      on: jest.fn((_event, _filter, callback) => {
        handlers.push(callback as (payload: unknown) => void);
        return channel;
      }),
      subscribe: jest.fn((callback?: (status: string) => void) => {
        statusHandler = callback ?? null;
        return channel;
      }),
    };

    const removeChannel = jest.fn().mockResolvedValue(undefined);

    (createClient as jest.Mock).mockReturnValue({
      channel: jest.fn(() => channel),
      removeChannel,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => {
      useRealtimeSync(true, "user-1");
      return null;
    }, { wrapper });

    return {
      handlers,
      channel,
      removeChannel,
      emitStatus(status: string) {
        statusHandler?.(status);
      },
    };
  }

  it("adds extension-saved links into cached space views when link_spaces inserts arrive", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
      },
    });

    const allFilters: LinkFilters = { is_deleted: false, is_archived: false };
    const spaceFilters: LinkFilters = {
      space_id: "space-1",
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

    const { handlers } = renderRealtimeHook(queryClient);

    await waitFor(() => {
      expect(handlers).toHaveLength(3);
    });

    const link = makeLink({ id: "link-2" });

    act(() => {
      handlers[0]({
        eventType: "INSERT",
        new: link,
        old: null,
      });
    });

    act(() => {
      handlers[1]({
        eventType: "INSERT",
        new: {
          link_id: link.id,
          space_id: spaceFilters.space_id,
        },
        old: null,
      });
    });

    const spaceCache = queryClient.getQueryData<LinksResponse>(
      queryKeys.links.list(spaceFilters)
    );

    expect(spaceCache?.links.some((item) => item.id === link.id)).toBe(true);
    queryClient.clear();
  });

  it("invalidates derived link queries when realtime updates arrive", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
      },
    });

    queryClient.setQueryData<LinksResponse>(
      queryKeys.links.list({ is_deleted: false, is_archived: false, content_type: "note" }),
      { links: [], total: 0 }
    );

    const invalidateSpy = jest
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    const { handlers } = renderRealtimeHook(queryClient);

    await waitFor(() => {
      expect(handlers).toHaveLength(3);
    });

    act(() => {
      handlers[0]({
        eventType: "INSERT",
        new: makeLink({ id: "link-derived", content_type: "note" }),
        old: null,
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      predicate: expect.any(Function),
      refetchType: "active",
    });
  });

  it("forces a freshness recovery after realtime reconnects", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
      },
    });

    const invalidateSpy = jest
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    const { emitStatus } = renderRealtimeHook(queryClient);

    act(() => {
      emitStatus("CHANNEL_ERROR");
      emitStatus("SUBSCRIBED");
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.links.all,
        refetchType: "active",
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.spaces.all,
      refetchType: "active",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.linkSpaces.all,
      refetchType: "active",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.all,
      refetchType: "active",
    });
  });

  it("invalidates notification queries when notification realtime events arrive", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
      },
    });

    const invalidateSpy = jest
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    const { handlers } = renderRealtimeHook(queryClient);

    await waitFor(() => {
      expect(handlers).toHaveLength(3);
    });

    act(() => {
      handlers[2]({
        eventType: "INSERT",
        new: {
          id: "notification-1",
          user_id: "user-1",
        },
        old: null,
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.all,
      refetchType: "active",
    });
  });
});
