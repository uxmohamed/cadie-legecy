"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Link, LinkFilters } from "@/features/links/types";
import type { DetectedContent } from "@/lib/content-detector";
import { queryKeys } from "@/lib/query/keys";

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
   * Updates: Remove from ALL cache, Add to TRASH cache
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

      // Snapshot both caches for rollback
      const previousAll = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(ALL_FILTERS));
      const previousTrash = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(TRASH_FILTERS));

      // Get the link before removing (to add to trash)
      const link = getLinkFromAnyCache(queryClient, id);

      // Remove from ALL cache
      removeLinkFromCache(queryClient, ALL_FILTERS, id);

      // Add to TRASH cache (with is_deleted flag)
      if (link) {
        const trashedLink = { ...link, is_deleted: true };
        addLinkToCache(queryClient, TRASH_FILTERS, trashedLink);
      }

      return { previousAll, previousTrash };
    },
    onError: (err, id, context) => {
      // Rollback both caches
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      if (context?.previousTrash) {
        queryClient.setQueryData(queryKeys.links.list(TRASH_FILTERS), context.previousTrash);
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
   * Updates: Remove from BOTH caches
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

      // Remove from BOTH caches
      removeLinkFromCache(queryClient, ALL_FILTERS, id);
      removeLinkFromCache(queryClient, TRASH_FILTERS, id);

      return { previousAll, previousTrash };
    },
    onError: (err, id, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      if (context?.previousTrash) {
        queryClient.setQueryData(queryKeys.links.list(TRASH_FILTERS), context.previousTrash);
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

      updateLinksCache(queryClient, filters, (old) => {
        if (!old) return old;
        return {
          ...old,
          links: old.links.map((link) =>
            link.id === id ? { ...link, ...updates } : link
          ),
        };
      });

      return { previousData };
    },
    onError: (err, vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to update link");
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

      updateLinksCache(queryClient, filters, (old) => {
        if (!old) return old;
        return {
          ...old,
          links: old.links.map((link) =>
            link.id === id ? { ...link, is_pinned: true } : link
          ),
        };
      });

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
      }
      toast.error("Failed to pin link");
    },
    onSuccess: () => {
      toast.success("Link pinned");
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

      updateLinksCache(queryClient, filters, (old) => {
        if (!old) return old;
        return {
          ...old,
          links: old.links.map((link) =>
            link.id === id ? { ...link, is_pinned: false } : link
          ),
        };
      });

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
      }
      toast.error("Failed to unpin link");
    },
    onSuccess: () => {
      toast.success("Link unpinned");
    },
  });

  /**
   * Batch delete (move to trash)
   * Updates: Remove from ALL cache, Add to TRASH cache
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

      // Get links before removing (to add to trash)
      const links = getLinksFromAnyCache(queryClient, ids);

      // Remove from ALL cache
      removeLinksFromCache(queryClient, ALL_FILTERS, ids);

      // Add to TRASH cache (with is_deleted flag)
      const trashedLinks = links.map((l) => ({ ...l, is_deleted: true }));
      addLinksToCache(queryClient, TRASH_FILTERS, trashedLinks);

      return { previousAll, previousTrash };
    },
    onError: (err, ids, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      if (context?.previousTrash) {
        queryClient.setQueryData(queryKeys.links.list(TRASH_FILTERS), context.previousTrash);
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
   * Updates: Remove from BOTH caches
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

      // Remove from BOTH caches
      removeLinksFromCache(queryClient, ALL_FILTERS, ids);
      removeLinksFromCache(queryClient, TRASH_FILTERS, ids);

      return { previousAll, previousTrash };
    },
    onError: (err, ids, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData(queryKeys.links.list(ALL_FILTERS), context.previousAll);
      }
      if (context?.previousTrash) {
        queryClient.setQueryData(queryKeys.links.list(TRASH_FILTERS), context.previousTrash);
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

      updateLinksCache(queryClient, filters, (old) => {
        if (!old) return old;
        const idsSet = new Set(ids);
        return {
          ...old,
          links: old.links.map((link) =>
            idsSet.has(link.id) ? { ...link, is_pinned: true } : link
          ),
        };
      });

      return { previousData };
    },
    onError: (err, ids, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
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

      updateLinksCache(queryClient, filters, (old) => {
        if (!old) return old;
        const idsSet = new Set(ids);
        return {
          ...old,
          links: old.links.map((link) =>
            idsSet.has(link.id) ? { ...link, is_pinned: false } : link
          ),
        };
      });

      return { previousData };
    },
    onError: (err, ids, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
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
        title: value,
        content_type: type,
        color_value: type === "color" ? value : undefined,
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

      return response.json() as Promise<{ links?: Link[]; count?: number; restored?: number }>;
    },
    onSuccess: (data, items) => {
      const createdLinks = data.links ?? [];
      const count = data.count ?? createdLinks.length;
      const restored = data.restored ?? 0;
      const successCount = count - restored;

      // Update ALL cache with new links (they're not in trash)
      if (createdLinks.length > 0) {
        addLinksToCache(queryClient, ALL_FILTERS, createdLinks);
      }

      // Show appropriate toast
      if (items.length === 1) {
        if (restored === 1) {
          toast.success(items[0].type === "color" ? "Color restored from trash" : "Link restored from trash");
        } else if (successCount === 1) {
          toast.success(items[0].type === "color" ? "Color saved successfully" : "Link saved successfully");
        }
      } else {
        const parts: string[] = [];
        if (successCount > 0) parts.push(`${successCount} added`);
        if (restored > 0) parts.push(`${restored} restored from trash`);
        if (parts.length > 0) {
          toast.success(parts.join(", "));
        }
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    },
  });

  return {
    // Single mutations
    deleteLink: deleteMutation.mutate,
    restoreLink: restoreMutation.mutate,
    permanentDeleteLink: permanentDeleteMutation.mutate,
    updateLink: (id: string, updates: Partial<Link>) => updateMutation.mutate({ id, updates }),
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

    // Loading states
    isDeleting: deleteMutation.isPending,
    isRestoring: restoreMutation.isPending,
    isUpdating: updateMutation.isPending,
    isAddingLinks: addLinksMutation.isPending,
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
