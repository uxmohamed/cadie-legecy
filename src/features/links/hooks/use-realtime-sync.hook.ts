"use client";

import * as React from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Link, LinkFilters } from "@/features/links/types";
import { queryKeys } from "@/lib/query/keys";
import { log } from "@/lib/logger";

type LinkRow = Link;
type LinkSpaceRow = {
  link_id: string;
  space_id: string;
};

/**
 * Response type from the links API
 */
interface LinksResponse {
  links: Link[];
  total: number;
}

interface SpacesResponse {
  spaces: Array<{
    id: string;
    link_count: number;
  }>;
}

function isLinkListQueryKey(queryKey: readonly unknown[]): queryKey is ReturnType<typeof queryKeys.links.list> {
  return queryKey[0] === "links" && queryKey[1] === "list" && typeof queryKey[2] === "string";
}

function parseLinkFilters(queryKey: readonly unknown[]): LinkFilters | null {
  if (!isLinkListQueryKey(queryKey)) {
    return null;
  }

  try {
    return JSON.parse(queryKey[2]) as LinkFilters;
  } catch {
    return null;
  }
}

function matchesFilters(link: Link, filters: LinkFilters): boolean {
  if (filters.is_deleted !== undefined && link.is_deleted !== filters.is_deleted) {
    return false;
  }

  if (filters.is_archived !== undefined && link.is_archived !== filters.is_archived) {
    return false;
  }

  if (filters.is_pinned !== undefined && link.is_pinned !== filters.is_pinned) {
    return false;
  }

  if (filters.content_type && link.content_type !== filters.content_type) {
    return false;
  }

  return true;
}

function isSafeRealtimePatchedList(filters: LinkFilters): boolean {
  if (filters.content_type || filters.is_pinned !== undefined) {
    return false;
  }

  if (filters.space_id) {
    return filters.is_deleted !== true && (filters.is_archived === false || filters.is_archived === undefined);
  }

  const isTrashOnly = filters.is_deleted === true && filters.is_archived === undefined;
  if (isTrashOnly) {
    return true;
  }

  const isDefaultActiveList =
    filters.is_deleted !== true &&
    (filters.is_archived === false || filters.is_archived === undefined);

  return isDefaultActiveList;
}

function isPatchedRealtimeQuery(queryKey: readonly unknown[]): boolean {
  if (!isLinkListQueryKey(queryKey) || queryKey.length !== 3) {
    return false;
  }

  const filters = parseLinkFilters(queryKey);
  return !!filters && isSafeRealtimePatchedList(filters);
}

function invalidateDerivedLinkQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  void queryClient.invalidateQueries({
    predicate: (query) => {
      const { queryKey } = query;
      if (!Array.isArray(queryKey) || queryKey[0] !== "links") {
        return false;
      }

      if (queryKey[1] === "detail") {
        return false;
      }

      return !isPatchedRealtimeQuery(queryKey);
    },
    refetchType: "active",
  });
}

function recoverFromRealtimeReconnect(
  queryClient: ReturnType<typeof useQueryClient>
) {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.links.all,
    refetchType: "active",
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.spaces.all,
    refetchType: "active",
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.linkSpaces.all,
    refetchType: "active",
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.notifications.all,
    refetchType: "active",
  });
}

function updateSpaceLinkCount(
  queryClient: ReturnType<typeof useQueryClient>,
  spaceId: string,
  delta: number
) {
  queryClient.setQueryData<SpacesResponse>(queryKeys.spaces.list(), (old) => {
    if (!old) {
      return old;
    }

    let changed = false;
    const spaces = old.spaces.map((space) => {
      if (space.id !== spaceId) {
        return space;
      }

      changed = true;
      return {
        ...space,
        link_count: Math.max(0, space.link_count + delta),
      };
    });

    return changed ? { spaces } : old;
  });
}

function forEachPatchedSpaceQuery(
  queryClient: ReturnType<typeof useQueryClient>,
  visitor: (queryKey: readonly unknown[], filters: LinkFilters) => void
) {
  const cachedQueries = queryClient.getQueriesData<LinksResponse>({
    queryKey: queryKeys.links.all,
  });

  cachedQueries.forEach(([queryKey]) => {
    if (!Array.isArray(queryKey)) {
      return;
    }

    const filters = parseLinkFilters(queryKey);
    if (!filters?.space_id || !isPatchedRealtimeQuery(queryKey)) {
      return;
    }

    visitor(queryKey, filters);
  });
}

function invalidateSpaceScopedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  spaceId: string
) {
  void queryClient.invalidateQueries({
    predicate: (query) => {
      const { queryKey } = query;
      if (!Array.isArray(queryKey) || !isLinkListQueryKey(queryKey)) {
        return false;
      }

      const filters = parseLinkFilters(queryKey);
      return filters?.space_id === spaceId;
    },
    refetchType: "active",
  });
}

function getCachedLink(
  queryClient: ReturnType<typeof useQueryClient>,
  linkId: string
): Link | null {
  const detail = queryClient.getQueryData<Link>(queryKeys.links.detail(linkId));
  if (detail) {
    return detail;
  }

  const allData = queryClient.getQueryData<LinksResponse>(
    queryKeys.links.list({ is_deleted: false, is_archived: false })
  );
  const activeLink = allData?.links.find((link) => link.id === linkId);
  if (activeLink) {
    return activeLink;
  }

  const trashData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list({ is_deleted: true }));
  return trashData?.links.find((link) => link.id === linkId) ?? null;
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
    const existing = old.links.find((l) => l.id === link.id);
    if (existing) {
      // If data is identical, skip update to avoid unnecessary re-render
      if (existing.updated_at === link.updated_at) {
        return old;
      }
      // Data actually changed — update and re-sort
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

  // Seed detail cache so follow-up space membership events can reuse the link.
  queryClient.setQueryData(queryKeys.links.detail(link.id), link);
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
    // Update in same view — but only if data actually changed
    const queryKey = queryKeys.links.list(newClassification.filters);
    queryClient.setQueryData<LinksResponse>(queryKey, (old) => {
      if (!old) return old;
      const existing = old.links.find((l) => l.id === newLink.id);
      // If data is identical, skip update to avoid unnecessary re-render
      if (existing && existing.updated_at === newLink.updated_at) {
        return old;
      }
      return {
        ...old,
        links: sortLinks(old.links.map((l) => (l.id === newLink.id ? newLink : l))),
      };
    });
  }

  forEachPatchedSpaceQuery(queryClient, (queryKey, filters) => {
    queryClient.setQueryData<LinksResponse>(queryKey, (old) => {
      if (!old) {
        return old;
      }

      const existing = old.links.find((link) => link.id === newLink.id);
      if (!existing) {
        return old;
      }

      if (!matchesFilters(newLink, filters)) {
        return {
          links: old.links.filter((link) => link.id !== newLink.id),
          total: Math.max(0, old.total - 1),
        };
      }

      if (existing.updated_at === newLink.updated_at) {
        return old;
      }

      return {
        ...old,
        links: sortLinks(old.links.map((link) => (link.id === newLink.id ? newLink : link))),
      };
    });
  });

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

  forEachPatchedSpaceQuery(queryClient, (queryKey) => {
    queryClient.setQueryData<LinksResponse>(queryKey, (old) => {
      if (!old) {
        return old;
      }

      const hadLink = old.links.some((item) => item.id === link.id);
      if (!hadLink) {
        return old;
      }

      return {
        links: old.links.filter((item) => item.id !== link.id),
        total: Math.max(0, old.total - 1),
      };
    });
  });

  // Remove from detail cache
  queryClient.removeQueries({ queryKey: queryKeys.links.detail(link.id) });
}

function handleSpaceLinkInsert(
  queryClient: ReturnType<typeof useQueryClient>,
  membership: LinkSpaceRow
) {
  updateSpaceLinkCount(queryClient, membership.space_id, 1);

  const link = getCachedLink(queryClient, membership.link_id);
  if (!link) {
    invalidateSpaceScopedQueries(queryClient, membership.space_id);
    return;
  }

  forEachPatchedSpaceQuery(queryClient, (queryKey, filters) => {
    if (filters.space_id !== membership.space_id || !matchesFilters(link, filters)) {
      return;
    }

    queryClient.setQueryData<LinksResponse>(queryKey, (old) => {
      if (!old) {
        return { links: [link], total: 1 };
      }

      const existing = old.links.find((item) => item.id === link.id);
      if (existing) {
        if (existing.updated_at === link.updated_at) {
          return old;
        }

        return {
          ...old,
          links: sortLinks(old.links.map((item) => (item.id === link.id ? link : item))),
        };
      }

      return {
        links: sortLinks([link, ...old.links]),
        total: old.total + 1,
      };
    });
  });
}

function handleSpaceLinkDelete(
  queryClient: ReturnType<typeof useQueryClient>,
  membership: LinkSpaceRow
) {
  forEachPatchedSpaceQuery(queryClient, (queryKey, filters) => {
    if (filters.space_id !== membership.space_id) {
      return;
    }

    queryClient.setQueryData<LinksResponse>(queryKey, (old) => {
      if (!old) {
        return old;
      }

      const hadLink = old.links.some((item) => item.id === membership.link_id);
      if (!hadLink) {
        return old;
      }

      return {
        links: old.links.filter((item) => item.id !== membership.link_id),
        total: Math.max(0, old.total - 1),
      };
    });
  });

  updateSpaceLinkCount(queryClient, membership.space_id, -1);
}

/**
 * Hook for realtime sync with TanStack Query cache
 * 
 * Updates cache directly on realtime events (no refetch/invalidation).
 * This keeps the UI snappy without network round-trips.
 */
export function useRealtimeSync(isAuthenticated: boolean, userId?: string): void {
  const queryClient = useQueryClient();
  const needsFreshnessRecoveryRef = React.useRef(false);

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
              invalidateDerivedLinkQueries(queryClient);
            }
            return;
          }

          if (eventType === "INSERT") {
            if (newLink) {
              handleInsert(queryClient, newLink);
              invalidateDerivedLinkQueries(queryClient);
            }
            return;
          }

          if (eventType === "UPDATE") {
            if (newLink && oldLink) {
              handleUpdate(queryClient, newLink, oldLink);
              invalidateDerivedLinkQueries(queryClient);
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "link_spaces",
        },
        (payload: RealtimePostgresChangesPayload<LinkSpaceRow>) => {
          const { eventType } = payload;
          const newMembership = payload.new as LinkSpaceRow | null;
          const oldMembership = payload.old as LinkSpaceRow | null;

          if (eventType === "INSERT" && newMembership) {
            handleSpaceLinkInsert(queryClient, newMembership);
            invalidateDerivedLinkQueries(queryClient);
            return;
          }

          if (eventType === "DELETE" && oldMembership) {
            handleSpaceLinkDelete(queryClient, oldMembership);
            invalidateDerivedLinkQueries(queryClient);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.all,
            refetchType: "active",
          });
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

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          needsFreshnessRecoveryRef.current = true;
          return;
        }

        if (status === "SUBSCRIBED" && needsFreshnessRecoveryRef.current) {
          needsFreshnessRecoveryRef.current = false;
          recoverFromRealtimeReconnect(queryClient);
        }
      });

    return () => {
      needsFreshnessRecoveryRef.current = false;
      supabase
        .removeChannel(channel)
        .catch(() => {
          // Ignore cleanup errors
        });
    };
  }, [isAuthenticated, userId, queryClient]);
}
