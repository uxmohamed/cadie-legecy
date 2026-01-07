"use client";

import * as React from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Link, LinkFilters } from "@/features/links/types";
import { queryKeys } from "@/lib/query/keys";
import { log } from "@/lib/logger";

type LinkRow = Link;

/**
 * Response type from the links API
 */
interface LinksResponse {
  links: Link[];
  total: number;
}

/**
 * Sort links: pinned first, then by created_at descending
 * This ensures consistent ordering across all cache updates
 */
function sortLinks(links: Link[]): Link[] {
  return [...links].sort((a, b) => {
    // Pinned items first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    // Then by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Determines which filter view a link belongs to
 */
function classifyLink(link: Link): { view: "all" | "trash"; filters: LinkFilters } {
  if (link.is_deleted) {
    return { view: "trash", filters: { is_deleted: true } };
  }
  return { view: "all", filters: { is_deleted: false, is_archived: false } };
}

/**
 * Handle INSERT event - add link to appropriate cache (maintains sort order)
 */
function handleInsert(
  queryClient: ReturnType<typeof useQueryClient>,
  link: Link
) {
  const { filters } = classifyLink(link);
  const queryKey = queryKeys.links.list(filters);

  queryClient.setQueryData<LinksResponse>(queryKey, (old) => {
    if (!old) return { links: [link], total: 1 };

    // Check if link already exists (dedup)
    const exists = old.links.some((l) => l.id === link.id);
    if (exists) {
      // Update existing link instead (re-sort in case pinned status changed)
      return {
        links: sortLinks(old.links.map((l) => (l.id === link.id ? link : l))),
        total: old.total,
      };
    }

    // Add and maintain pinned-first sort order
    return {
      links: sortLinks([link, ...old.links]),
      total: old.total + 1,
    };
  });
}

/**
 * Handle UPDATE event - update link in cache, possibly move between views (maintains sort order)
 */
function handleUpdate(
  queryClient: ReturnType<typeof useQueryClient>,
  newLink: Link,
  oldLink: Link
) {
  const oldClassification = classifyLink(oldLink);
  const newClassification = classifyLink(newLink);

  // If link moved between views (e.g., moved to/from trash)
  if (oldClassification.view !== newClassification.view) {
    // Remove from old view
    const oldQueryKey = queryKeys.links.list(oldClassification.filters);
    queryClient.setQueryData<LinksResponse>(oldQueryKey, (old) => {
      if (!old) return old;
      return {
        links: old.links.filter((l) => l.id !== newLink.id),
        total: Math.max(0, old.total - 1),
      };
    });

    // Add to new view (maintain sort order)
    const newQueryKey = queryKeys.links.list(newClassification.filters);
    queryClient.setQueryData<LinksResponse>(newQueryKey, (old) => {
      if (!old) return { links: [newLink], total: 1 };
      return {
        links: sortLinks([newLink, ...old.links.filter((l) => l.id !== newLink.id)]),
        total: old.total + 1,
      };
    });
  } else {
    // Update in same view (re-sort in case pinned status changed)
    const queryKey = queryKeys.links.list(newClassification.filters);
    queryClient.setQueryData<LinksResponse>(queryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        links: sortLinks(old.links.map((l) => (l.id === newLink.id ? newLink : l))),
      };
    });
  }

  // Also update detail cache if exists
  queryClient.setQueryData(queryKeys.links.detail(newLink.id), newLink);
}

/**
 * Handle DELETE event - remove link from all caches
 */
function handleDelete(
  queryClient: ReturnType<typeof useQueryClient>,
  link: Link
) {
  // Remove from all list caches (both views)
  const allFilters: LinkFilters[] = [
    { is_deleted: false, is_archived: false },
    { is_deleted: true },
  ];

  for (const filters of allFilters) {
    const queryKey = queryKeys.links.list(filters);
    queryClient.setQueryData<LinksResponse>(queryKey, (old) => {
      if (!old) return old;
      const hadLink = old.links.some((l) => l.id === link.id);
      return {
        links: old.links.filter((l) => l.id !== link.id),
        total: hadLink ? Math.max(0, old.total - 1) : old.total,
      };
    });
  }

  // Remove from detail cache
  queryClient.removeQueries({ queryKey: queryKeys.links.detail(link.id) });
}

/**
 * Hook for realtime sync with TanStack Query cache
 * 
 * Updates cache directly on realtime events (no refetch/invalidation).
 * This keeps the UI snappy without network round-trips.
 */
export function useRealtimeSync(isAuthenticated: boolean, userId?: string): void {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`links_for_user_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "links",
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<LinkRow>) => {
          const { eventType } = payload;
          const newLink = payload.new as LinkRow | null;
          const oldLink = payload.old as LinkRow | null;

          if (eventType === "DELETE") {
            if (oldLink) {
              handleDelete(queryClient, oldLink);
            }
            return;
          }

          if (eventType === "INSERT") {
            if (newLink) {
              handleInsert(queryClient, newLink);
            }
            return;
          }

          if (eventType === "UPDATE") {
            if (newLink && oldLink) {
              handleUpdate(queryClient, newLink, oldLink);
            }
          }
        },
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV === "development") {
          if (status === "SUBSCRIBED") {
            log.info("Realtime: Successfully subscribed (TanStack Query)", { userId });
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            log.warn("Realtime: Subscription issue (TanStack Query)", { status, userId });
          }
        }
      });

    return () => {
      supabase
        .removeChannel(channel)
        .catch(() => {
          // Ignore cleanup errors
        });
    };
  }, [isAuthenticated, userId, queryClient]);
}
