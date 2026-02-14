"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Link, LinkFilters } from "@/features/links/types";
import type { DetectedContent } from "@/lib/content-detector";
import { queryKeys } from "@/lib/query/keys";

/**
 * Extract a readable name from an image URL
 * e.g. "https://example.com/path/my-photo.jpg" → "my-photo"
 */
function getImageNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split("/").pop() || "";
    // Remove extension and timestamp prefixes (e.g. "1739523600000.png" → "Image")
    const name = filename.replace(/\.[^/.]+$/, "");
    // If name is just a number (timestamp), return generic name
    if (!name || /^\d+$/.test(name)) return "Image";
    // Clean up: replace dashes/underscores with spaces, title-case
    return name
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || "Image";
  } catch {
    return "Image";
  }
}

/**
 * Response type from the links API
 */
interface LinksResponse {
  links: Link[];
  total: number;
}

/**
 * Standard filter sets for cross-cache updates
 */
const ALL_FILTERS: LinkFilters = { is_deleted: false, is_archived: false };
const TRASH_FILTERS: LinkFilters = { is_deleted: true };

/**
 * Check if filters represent a space-specific view
 */
function isSpaceFilter(filters: LinkFilters): boolean {
  return !!filters.space_id;
}

/**
 * Check if filters are different from standard ALL/TRASH filters
 * Used to determine if we need to update an additional cache
 */
function isCustomFilter(filters: LinkFilters): boolean {
  const isAll = !filters.space_id && filters.is_deleted === false && filters.is_archived === false && !filters.is_pinned;
  const isTrash = !filters.space_id && filters.is_deleted === true;
  return !isAll && !isTrash;
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
 * Helper to update links in cache optimistically
 */
function updateLinksCache(
  queryClient: ReturnType<typeof useQueryClient>,
  filters: LinkFilters,
  updater: (old: LinksResponse | undefined) => LinksResponse | undefined
) {
  queryClient.setQueryData<LinksResponse>(queryKeys.links.list(filters), updater);
}

/**
 * Mark all link list queries as stale without triggering immediate refetches.
 * This keeps inactive filtered views fresh when revisited after optimistic updates.
 */
function markLinkListsStale(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.links.all,
    refetchType: "none",
  });
}

/**
 * Remove a link from a cache by ID
 */
function removeLinkFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  filters: LinkFilters,
  id: string
) {
  updateLinksCache(queryClient, filters, (old) => {
    if (!old) return old;
    const hadLink = old.links.some((l) => l.id === id);
    return {
      links: old.links.filter((link) => link.id !== id),
      total: hadLink ? Math.max(0, old.total - 1) : old.total,
    };
  });
}

/**
 * Add a link to a cache (maintains pinned-first sort order)
 */
function addLinkToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  filters: LinkFilters,
  link: Link
) {
  updateLinksCache(queryClient, filters, (old) => {
    if (!old) return { links: [link], total: 1 };
    // Avoid duplicates
    const exists = old.links.some((l) => l.id === link.id);
    if (exists) {
      return {
        ...old,
        links: sortLinks(old.links.map((l) => (l.id === link.id ? link : l))),
      };
    }
    return {
      links: sortLinks([link, ...old.links]),
      total: old.total + 1,
    };
  });
}

/**
 * Remove multiple links from a cache
 */
function removeLinksFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  filters: LinkFilters,
  ids: string[]
) {
  const idsSet = new Set(ids);
  updateLinksCache(queryClient, filters, (old) => {
    if (!old) return old;
    const removedCount = old.links.filter((l) => idsSet.has(l.id)).length;
    return {
      links: old.links.filter((link) => !idsSet.has(link.id)),
      total: Math.max(0, old.total - removedCount),
    };
  });
}

/**
 * Add multiple links to a cache (maintains pinned-first sort order)
 */
function addLinksToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  filters: LinkFilters,
  links: Link[]
) {
  updateLinksCache(queryClient, filters, (old) => {
    if (!old) return { links: sortLinks(links), total: links.length };
    const existingIds = new Set(old.links.map((l) => l.id));
    const newLinks = links.filter((l) => !existingIds.has(l.id));
    return {
      links: sortLinks([...newLinks, ...old.links]),
      total: old.total + newLinks.length,
    };
  });
}

/**
 * Atomically swap temporary links for real server-returned links.
 * Performs remove + add in a SINGLE setQueryData call to avoid
 * the flash caused by two separate re-renders.
 */
function swapLinksInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  filters: LinkFilters,
  tempIds: string[],
  realLinks: Link[]
) {
  const tempIdSet = new Set(tempIds);
  updateLinksCache(queryClient, filters, (old) => {
    if (!old) {
      return realLinks.length > 0
        ? { links: sortLinks(realLinks), total: realLinks.length }
        : old;
    }
    // Remove temp IDs and add real links in one pass
    const withoutTemps = old.links.filter((link) => !tempIdSet.has(link.id));
    const existingIds = new Set(withoutTemps.map((l) => l.id));
    const newLinks = realLinks.filter((l) => !existingIds.has(l.id));
    const removedCount = old.links.length - withoutTemps.length;
    return {
      links: sortLinks([...newLinks, ...withoutTemps]),
      total: old.total - removedCount + newLinks.length,
    };
  });
}

/**
 * Get a link from any cache (checks both all and trash)
 */
function getLinkFromAnyCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string
): Link | undefined {
  // Check all view first
  const allData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS));
  const linkInAll = allData?.links.find((l) => l.id === id);
  if (linkInAll) return linkInAll;

  // Check trash view
  const trashData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(TRASH_FILTERS));
  const linkInTrash = trashData?.links.find((l) => l.id === id);
  if (linkInTrash) return linkInTrash;

  return undefined;
}

/**
 * Get multiple links from any cache
 */
function getLinksFromAnyCache(
  queryClient: ReturnType<typeof useQueryClient>,
  ids: string[]
): Link[] {
  const idsSet = new Set(ids);
  const result: Link[] = [];

  // Check all view
  const allData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS));
  if (allData) {
    result.push(...allData.links.filter((l) => idsSet.has(l.id)));
  }

  // Check trash view (avoid duplicates)
  const foundIds = new Set(result.map((l) => l.id));
  const trashData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(TRASH_FILTERS));
  if (trashData) {
    result.push(...trashData.links.filter((l) => idsSet.has(l.id) && !foundIds.has(l.id)));
  }

  return result;
}

/**
 * Hook for all link mutations with optimistic updates
 * 
 * Mutations update BOTH caches directly (optimistic), then let realtime confirm.
 * On error, cache rolls back automatically.
 */
export function useLinkMutations(filters: LinkFilters) {
  const queryClient = useQueryClient();

  /**
   * Delete link (move to trash)
   * Updates: Remove from ALL cache, Add to TRASH cache, Remove from current filter cache (if space)
   */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.userMessage ?? "Failed to delete link");
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });

      // Snapshot caches for rollback
      const previousAll = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS));
      const previousTrash = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(TRASH_FILTERS));
      const previousCurrent = isCustomFilter(filters)
        ? queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters))
        : undefined;

      // Get the link before removing (to add to trash)
      const link = getLinkFromAnyCache(queryClient, id);

      // Remove from ALL cache
      removeLinkFromCache(queryClient, ALL_FILTERS, id);

      // Remove from current filter cache (if viewing a space or custom filter)
      if (isCustomFilter(filters)) {
        removeLinkFromCache(queryClient, filters, id);
      }

      // Add to TRASH cache (with is_deleted flag)
      if (link) {
        const trashedLink = { ...link, is_deleted: true };
        addLinkToCache(queryClient, TRASH_FILTERS, trashedLink);
      }

      return { previousAll, previousTrash, previousCurrent };
    },
    onError: (err, id, context) => {
      // Rollback all caches
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      if (context?.previousTrash) {
        queryClient.setQueryData(queryKeys.links.list(TRASH_FILTERS), context.previousTrash);
      }
      if (context?.previousCurrent && isCustomFilter(filters)) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousCurrent);
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete link");
    },
    onSuccess: () => {
      toast.success("Link moved to trash");
    },
  });

  /**
   * Restore link from trash
   * Updates: Remove from TRASH cache, Add to ALL cache
   */
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_deleted: false, is_archived: false }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.userMessage ?? "Failed to restore link");
      }
      return response.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });

      // Snapshot both caches for rollback
      const previousAll = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS));
      const previousTrash = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(TRASH_FILTERS));

      // Get the link before removing (to add to all)
      const link = getLinkFromAnyCache(queryClient, id);

      // Remove from TRASH cache
      removeLinkFromCache(queryClient, TRASH_FILTERS, id);

      // Add to ALL cache (with is_deleted: false)
      if (link) {
        const restoredLink = { ...link, is_deleted: false, is_archived: false };
        addLinkToCache(queryClient, ALL_FILTERS, restoredLink);
      }

      return { previousAll, previousTrash };
    },
    onError: (err, id, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      if (context?.previousTrash) {
        queryClient.setQueryData(queryKeys.links.list(TRASH_FILTERS), context.previousTrash);
      }
      toast.error(err instanceof Error ? err.message : "Failed to restore link");
    },
    onSuccess: () => {
      toast.success("Link restored");
    },
  });

  /**
   * Permanently delete link
   * Updates: Remove from ALL caches including space-specific
   */
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/links/${id}/permanent`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.userMessage ?? "Failed to permanently delete link");
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });

      const previousAll = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS));
      const previousTrash = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(TRASH_FILTERS));
      const previousCurrent = isCustomFilter(filters)
        ? queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters))
        : undefined;

      // Remove from ALL caches
      removeLinkFromCache(queryClient, ALL_FILTERS, id);
      removeLinkFromCache(queryClient, TRASH_FILTERS, id);
      if (isCustomFilter(filters)) {
        removeLinkFromCache(queryClient, filters, id);
      }

      return { previousAll, previousTrash, previousCurrent };
    },
    onError: (err, id, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      if (context?.previousTrash) {
        queryClient.setQueryData(queryKeys.links.list(TRASH_FILTERS), context.previousTrash);
      }
      if (context?.previousCurrent && isCustomFilter(filters)) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousCurrent);
      }
      toast.error(err instanceof Error ? err.message : "Failed to permanently delete link");
    },
    onSuccess: () => {
      toast.success("Link permanently deleted");
    },
  });

  /**
   * Update link
   */
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Link> }) => {
      const response = await fetch(`/api/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.userMessage ?? "Failed to update link");
      }
      return response.json();
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });
      const previousData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters));
      const previousAll = isCustomFilter(filters)
        ? queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS))
        : undefined;

      const updater = (old: LinksResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          links: old.links.map((link) =>
            link.id === id ? { ...link, ...updates } : link
          ),
        };
      };

      updateLinksCache(queryClient, filters, updater);
      if (isCustomFilter(filters)) {
        updateLinksCache(queryClient, ALL_FILTERS, updater);
      }

      return { previousData, previousAll };
    },
    onError: (err, vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
      }
      if (context?.previousAll && isCustomFilter(filters)) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      toast.error(err instanceof Error ? err.message : "Failed to update link");
    },
    onSettled: () => {
      markLinkListsStale(queryClient);
    },
  });

  /**
   * Pin link
   */
  const pinMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: true }),
      });
      if (!response.ok) {
        throw new Error("Failed to pin link");
      }
      return response.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });
      const previousData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters));
      const previousAll = isCustomFilter(filters)
        ? queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS))
        : undefined;

      const updater = (old: LinksResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          links: old.links.map((link) =>
            link.id === id ? { ...link, is_pinned: true } : link
          ),
        };
      };

      updateLinksCache(queryClient, filters, updater);
      if (isCustomFilter(filters)) {
        updateLinksCache(queryClient, ALL_FILTERS, updater);
      }

      return { previousData, previousAll };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
      }
      if (context?.previousAll && isCustomFilter(filters)) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      toast.error("Failed to pin link");
    },
    onSuccess: () => {
      toast.success("Link pinned");
    },
    onSettled: () => {
      markLinkListsStale(queryClient);
    },
  });

  /**
   * Unpin link
   */
  const unpinMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: false }),
      });
      if (!response.ok) {
        throw new Error("Failed to unpin link");
      }
      return response.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });
      const previousData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters));
      const previousAll = isCustomFilter(filters)
        ? queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS))
        : undefined;

      const updater = (old: LinksResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          links: old.links.map((link) =>
            link.id === id ? { ...link, is_pinned: false } : link
          ),
        };
      };

      updateLinksCache(queryClient, filters, updater);
      if (isCustomFilter(filters)) {
        updateLinksCache(queryClient, ALL_FILTERS, updater);
      }

      return { previousData, previousAll };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
      }
      if (context?.previousAll && isCustomFilter(filters)) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      toast.error("Failed to unpin link");
    },
    onSuccess: () => {
      toast.success("Link unpinned");
    },
    onSettled: () => {
      markLinkListsStale(queryClient);
    },
  });

  /**
   * Batch delete (move to trash)
   * Updates: Remove from ALL cache, Add to TRASH cache, Remove from current filter cache (if space)
   */
  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/links/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", ids }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Failed to delete links");
      }
      return ids;
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });

      const previousAll = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS));
      const previousTrash = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(TRASH_FILTERS));
      const previousCurrent = isCustomFilter(filters)
        ? queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters))
        : undefined;

      // Get links before removing (to add to trash)
      const links = getLinksFromAnyCache(queryClient, ids);

      // Remove from ALL cache
      removeLinksFromCache(queryClient, ALL_FILTERS, ids);

      // Remove from current filter cache (if viewing a space or custom filter)
      if (isCustomFilter(filters)) {
        removeLinksFromCache(queryClient, filters, ids);
      }

      // Add to TRASH cache (with is_deleted flag)
      const trashedLinks = links.map((l) => ({ ...l, is_deleted: true }));
      addLinksToCache(queryClient, TRASH_FILTERS, trashedLinks);

      return { previousAll, previousTrash, previousCurrent };
    },
    onError: (err, ids, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      if (context?.previousTrash) {
        queryClient.setQueryData(queryKeys.links.list(TRASH_FILTERS), context.previousTrash);
      }
      if (context?.previousCurrent && isCustomFilter(filters)) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousCurrent);
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete links");
    },
    onSuccess: (ids) => {
      toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} moved to trash`);
    },
  });

  /**
   * Batch restore
   * Updates: Remove from TRASH cache, Add to ALL cache
   */
  const batchRestoreMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/links/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", ids }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Failed to restore links");
      }
      return ids;
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });

      const previousAll = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS));
      const previousTrash = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(TRASH_FILTERS));

      // Get links before removing (to add to all)
      const links = getLinksFromAnyCache(queryClient, ids);

      // Remove from TRASH cache
      removeLinksFromCache(queryClient, TRASH_FILTERS, ids);

      // Add to ALL cache (with is_deleted: false)
      const restoredLinks = links.map((l) => ({ ...l, is_deleted: false, is_archived: false }));
      addLinksToCache(queryClient, ALL_FILTERS, restoredLinks);

      return { previousAll, previousTrash };
    },
    onError: (err, ids, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      if (context?.previousTrash) {
        queryClient.setQueryData(queryKeys.links.list(TRASH_FILTERS), context.previousTrash);
      }
      toast.error(err instanceof Error ? err.message : "Failed to restore links");
    },
    onSuccess: (ids) => {
      toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} restored`);
    },
  });

  /**
   * Batch permanent delete
   * Updates: Remove from ALL caches including space-specific
   */
  const batchPermanentDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/links/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "permanent_delete", ids }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Failed to permanently delete links");
      }
      return ids;
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });

      const previousAll = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS));
      const previousTrash = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(TRASH_FILTERS));
      const previousCurrent = isCustomFilter(filters)
        ? queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters))
        : undefined;

      // Remove from ALL caches
      removeLinksFromCache(queryClient, ALL_FILTERS, ids);
      removeLinksFromCache(queryClient, TRASH_FILTERS, ids);
      if (isCustomFilter(filters)) {
        removeLinksFromCache(queryClient, filters, ids);
      }

      return { previousAll, previousTrash, previousCurrent };
    },
    onError: (err, ids, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      if (context?.previousTrash) {
        queryClient.setQueryData(queryKeys.links.list(TRASH_FILTERS), context.previousTrash);
      }
      if (context?.previousCurrent && isCustomFilter(filters)) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousCurrent);
      }
      toast.error(err instanceof Error ? err.message : "Failed to permanently delete links");
    },
    onSuccess: (ids) => {
      toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} permanently deleted`);
    },
  });

  /**
   * Batch pin
   */
  const batchPinMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/links/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", ids }),
      });
      if (!response.ok) {
        throw new Error("Failed to pin links");
      }
      return ids;
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });
      const previousData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters));
      const previousAll = isCustomFilter(filters)
        ? queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS))
        : undefined;

      const updater = (old: LinksResponse | undefined) => {
        if (!old) return old;
        const idsSet = new Set(ids);
        return {
          ...old,
          links: old.links.map((link) =>
            idsSet.has(link.id) ? { ...link, is_pinned: true } : link
          ),
        };
      };

      updateLinksCache(queryClient, filters, updater);
      if (isCustomFilter(filters)) {
        updateLinksCache(queryClient, ALL_FILTERS, updater);
      }

      return { previousData, previousAll };
    },
    onError: (err, ids, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
      }
      if (context?.previousAll && isCustomFilter(filters)) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      toast.error("Failed to pin links");
    },
    onSuccess: (ids) => {
      toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} pinned`);
    },
  });

  /**
   * Batch unpin
   */
  const batchUnpinMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/links/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unpin", ids }),
      });
      if (!response.ok) {
        throw new Error("Failed to unpin links");
      }
      return ids;
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });
      const previousData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters));
      const previousAll = isCustomFilter(filters)
        ? queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS))
        : undefined;

      const updater = (old: LinksResponse | undefined) => {
        if (!old) return old;
        const idsSet = new Set(ids);
        return {
          ...old,
          links: old.links.map((link) =>
            idsSet.has(link.id) ? { ...link, is_pinned: false } : link
          ),
        };
      };

      updateLinksCache(queryClient, filters, updater);
      if (isCustomFilter(filters)) {
        updateLinksCache(queryClient, ALL_FILTERS, updater);
      }

      return { previousData, previousAll };
    },
    onError: (err, ids, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
      }
      if (context?.previousAll && isCustomFilter(filters)) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      toast.error("Failed to unpin links");
    },
    onSuccess: (ids) => {
      toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} unpinned`);
    },
  });

  /**
   * Add links (batch create)
   * Updates: Add to ALL cache
   */
  const addLinksMutation = useMutation({
    mutationFn: async (items: DetectedContent[]) => {
      const linksToAdd = items.map(({ value, type }) => ({
        url: value,
        title: type === "image" ? getImageNameFromUrl(value) : value,
        content_type: type,
        color_value: type === "color" ? value : undefined,
        og_image_url: type === "image" ? value : undefined,
      }));

      const response = await fetch("/api/links/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", links: linksToAdd }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Failed to add links");
      }

      return response.json() as Promise<{ links?: Link[]; count?: number; restored?: number; duplicates?: number }>;
    },
    onMutate: async (items) => {
      // Cancel outgoing queries to prevent overwrites
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });

      // Snapshot current cache for rollback
      const previousAll = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS));
      const previousCurrent = isCustomFilter(filters)
        ? queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters))
        : undefined;

      // Generate optimistic Link objects
      const now = new Date().toISOString();
      const tempIds: string[] = [];
      const optimisticLinks: Link[] = items.map(({ value, type }) => {
        const tempId = crypto.randomUUID();
        tempIds.push(tempId);

        const isColor = type === "color";
        const isImage = type === "image";
        let domain = "";
        if (isColor) {
          domain = "color";
        } else if (isImage) {
          domain = "image";
        } else {
          try {
            domain = new URL(value).hostname.replace(/^www\./, "");
          } catch {
            domain = value;
          }
        }

        return {
          id: tempId,
          user_id: "",
          url: value,
          clean_url: value,
          title: isImage ? getImageNameFromUrl(value) : value,
          domain,
          content_type: type,
          color_value: isColor ? value : null,
          content_text: null,
          favicon_url: null,
          og_image_url: isImage ? value : null,
          description: null,
          ai_summary: null,
          ai_tags: null,
          ai_key_themes: null,
          ai_quotes: null,
          ai_facts: null,
          ai_people: null,
          is_pinned: false,
          is_archived: false,
          is_deleted: false,
          deleted_at: null,
          is_favorite: false,
          read_at: null,
          sort_order: 0,
          created_at: now,
          updated_at: now,
          final_url: null,
          canonical_url: null,
          site_name: null,
          favicon_variants: null,
          preview_image_width: null,
          preview_image_height: null,
          theme_color: null,
          language: null,
          word_count: null,
          reading_time_minutes: null,
          status_code: null,
          fetch_status: "pending" as const,
          fetched_at: null,
          etag: null,
          last_modified: null,
        };
      });

      // Add optimistic links to cache immediately
      addLinksToCache(queryClient, ALL_FILTERS, optimisticLinks);
      if (isCustomFilter(filters)) {
        addLinksToCache(queryClient, filters, optimisticLinks);
      }

      return { tempIds, previousAll, previousCurrent };
    },
    onSuccess: (data, items, context) => {
      const createdLinks = data.links ?? [];
      const count = data.count ?? createdLinks.length;
      const restored = data.restored ?? 0;
      const successCount = count - restored;
      const duplicateCount = data.duplicates ?? 0;

      // Atomically swap temp links for real links (single setQueryData = no flash)
      if (context?.tempIds) {
        swapLinksInCache(queryClient, ALL_FILTERS, context.tempIds, createdLinks);
        if (isCustomFilter(filters)) {
          swapLinksInCache(queryClient, filters, context.tempIds, createdLinks);
        }
      }

      // Show appropriate toast
      const itemLabel = (type: string) =>
        type === "color" ? "Color" : type === "image" ? "Image" : "Link";

      if (items.length === 1) {
        const label = itemLabel(items[0].type);
        if (duplicateCount === 1) {
          toast.info(`${label} already in your list`);
        } else if (restored === 1) {
          toast.success(`${label} restored from trash`);
        } else if (successCount === 1) {
          toast.success(`${label} saved successfully`);
        }
      } else {
        const parts: string[] = [];
        if (successCount > 0) parts.push(`${successCount} added`);
        if (restored > 0) parts.push(`${restored} restored from trash`);
        if (duplicateCount > 0) parts.push(`${duplicateCount} already in list`);
        if (parts.length > 0) {
          toast.success(parts.join(", "));
        }
      }
    },
    onError: (err, _items, context) => {
      // Rollback: restore previous cache snapshot
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      if (context?.previousCurrent && isCustomFilter(filters)) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousCurrent);
      }
      toast.error(err instanceof Error ? err.message : "Failed to save");
    },
    onSettled: () => {
      // Staggered fallback invalidation — safety net for realtime gaps
      const delays = [5000, 10000, 15000, 25000];
      delays.forEach((delay) => {
        setTimeout(() => {
          const current = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS));
          const hasPending = current?.links.some(
            (l) => l.fetch_status === "pending" || l.fetch_status === "fetching"
          );
          if (hasPending) {
            queryClient.invalidateQueries({ queryKey: queryKeys.links.all, refetchType: "active" });
          }
        }, delay);
      });
    },
  });

  /**
   * Upload image files and create image links
   */
  const addImageFilesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const {
        uploadImage,
        validateImageFile,
        getUserImageCount,
        MAX_FILES_PER_UPLOAD,
        MAX_IMAGES_PER_USER,
      } = await import("@/features/links/services/image-upload.service");
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Enforce batch size limit
      if (files.length > MAX_FILES_PER_UPLOAD) {
        throw new Error(`Too many files. Maximum is ${MAX_FILES_PER_UPLOAD} per upload`);
      }

      // Validate all files before uploading any
      for (const file of files) {
        const error = validateImageFile(file);
        if (error) throw new Error(error);
      }

      // Check user quota
      const currentCount = await getUserImageCount(user.id);
      if (currentCount + files.length > MAX_IMAGES_PER_USER) {
        const remaining = Math.max(0, MAX_IMAGES_PER_USER - currentCount);
        throw new Error(
          remaining === 0
            ? `Image limit reached (${MAX_IMAGES_PER_USER}). Delete some images to upload more`
            : `Can only upload ${remaining} more image${remaining === 1 ? "" : "s"} (limit: ${MAX_IMAGES_PER_USER})`
        );
      }

      // Upload files and collect URLs + names
      const uploadedItems: { url: string; name: string }[] = [];
      for (const file of files) {
        const url = await uploadImage(user.id, file);
        // Use filename without extension as title
        const name = file.name.replace(/\.[^/.]+$/, "");
        uploadedItems.push({ url, name });
      }

      // Create links via batch API
      const linksToAdd = uploadedItems.map(({ url, name }) => ({
        url,
        title: name,
        content_type: "image",
        og_image_url: url,
      }));

      const response = await fetch("/api/links/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", links: linksToAdd }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Failed to save images");
      }

      return response.json() as Promise<{ links?: Link[]; count?: number; duplicates?: number }>;
    },
    onMutate: async (files) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });
      const previousAll = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS));

      const now = new Date().toISOString();
      const tempIds: string[] = [];
      const optimisticLinks: Link[] = files.map((file) => {
        const tempId = crypto.randomUUID();
        tempIds.push(tempId);
        const objectUrl = URL.createObjectURL(file);
        return {
          id: tempId,
          user_id: "",
          url: objectUrl,
          clean_url: objectUrl,
          title: file.name,
          domain: "image",
          content_type: "image" as const,
          color_value: null,
          content_text: null,
          favicon_url: null,
          og_image_url: objectUrl,
          description: null,
          ai_summary: null,
          ai_tags: null,
          ai_key_themes: null,
          ai_quotes: null,
          ai_facts: null,
          ai_people: null,
          is_pinned: false,
          is_archived: false,
          is_deleted: false,
          deleted_at: null,
          is_favorite: false,
          read_at: null,
          sort_order: 0,
          created_at: now,
          updated_at: now,
          final_url: null,
          canonical_url: null,
          site_name: null,
          favicon_variants: null,
          preview_image_width: null,
          preview_image_height: null,
          theme_color: null,
          language: null,
          word_count: null,
          reading_time_minutes: null,
          status_code: null,
          fetch_status: "pending" as const,
          fetched_at: null,
          etag: null,
          last_modified: null,
        };
      });

      addLinksToCache(queryClient, ALL_FILTERS, optimisticLinks);
      return { tempIds, previousAll };
    },
    onSuccess: (data, _files, context) => {
      const createdLinks = data.links ?? [];
      // Atomically swap temp links for real links (single setQueryData = no flash)
      if (context?.tempIds) {
        swapLinksInCache(queryClient, ALL_FILTERS, context.tempIds, createdLinks);
      }
      const count = createdLinks.length;
      toast.success(`${count} ${count === 1 ? "image" : "images"} saved`);
    },
    onError: (err, _files, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      toast.error(err instanceof Error ? err.message : "Failed to upload images");
    },
    onSettled: () => {
      setTimeout(() => {
        const current = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS));
        const hasPending = current?.links.some(
          (l) => l.fetch_status === "pending" || l.fetch_status === "fetching"
        );
        if (hasPending) {
          queryClient.invalidateQueries({ queryKey: queryKeys.links.all, refetchType: "active" });
        }
      }, 3000);
    },
  });

  return {
    // Single mutations
    deleteLink: deleteMutation.mutate,
    restoreLink: restoreMutation.mutate,
    permanentDeleteLink: permanentDeleteMutation.mutate,
    updateLink: (id: string, updates: Partial<Link>) => updateMutation.mutateAsync({ id, updates }),
    pinLink: pinMutation.mutate,
    unpinLink: unpinMutation.mutate,

    // Batch mutations
    batchDeleteLinks: batchDeleteMutation.mutate,
    batchRestoreLinks: batchRestoreMutation.mutate,
    batchPermanentDeleteLinks: batchPermanentDeleteMutation.mutate,
    batchPinLinks: batchPinMutation.mutate,
    batchUnpinLinks: batchUnpinMutation.mutate,

    // Add links
    addLinks: addLinksMutation.mutate,
    addImageFiles: addImageFilesMutation.mutate,

    // Loading states
    isDeleting: deleteMutation.isPending,
    isRestoring: restoreMutation.isPending,
    isUpdating: updateMutation.isPending,
    isAddingLinks: addLinksMutation.isPending,
    isUploadingImages: addImageFilesMutation.isPending,
  };
}

/**
 * Utility hook for clipboard operations
 */
export function useCopyUrl() {
  const handleCopyUrl = async (url: string, isColor?: boolean) => {
    try {
      await navigator.clipboard.writeText(url);
      const isColorValue = isColor ?? /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(url);
      toast.success(isColorValue ? "Color copied to clipboard" : "URL copied to clipboard");
    } catch {
      const isColorValue = isColor ?? /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(url);
      toast.error(isColorValue ? "Failed to copy color" : "Failed to copy URL");
    }
  };

  return { copyUrl: handleCopyUrl };
}
