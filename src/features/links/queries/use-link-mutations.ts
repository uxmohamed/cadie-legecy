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
 * Hook for all link mutations with optimistic updates
 * 
 * Mutations update the cache directly (optimistic), then let realtime confirm.
 * On error, cache rolls back automatically.
 */
export function useLinkMutations(filters: LinkFilters) {
  const queryClient = useQueryClient();

  /**
   * Delete link (move to trash)
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
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: queryKeys.links.all });

      // Snapshot for rollback
      const previousData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters));

      // Optimistic update - remove from list
      updateLinksCache(queryClient, filters, (old) => {
        if (!old) return old;
        return {
          links: old.links.filter((link) => link.id !== id),
          total: Math.max(0, old.total - 1),
        };
      });

      return { previousData };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete link");
    },
    onSuccess: () => {
      toast.success("Link moved to trash");
    },
    // No onSettled invalidation - realtime will confirm
  });

  /**
   * Restore link from trash
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
      const previousData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters));

      // If in trash view, remove from list
      if (filters.is_deleted) {
        updateLinksCache(queryClient, filters, (old) => {
          if (!old) return old;
          return {
            links: old.links.filter((link) => link.id !== id),
            total: Math.max(0, old.total - 1),
          };
        });
      }

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to restore link");
    },
    onSuccess: () => {
      toast.success("Link restored");
    },
  });

  /**
   * Permanently delete link
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
      const previousData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters));

      updateLinksCache(queryClient, filters, (old) => {
        if (!old) return old;
        return {
          links: old.links.filter((link) => link.id !== id),
          total: Math.max(0, old.total - 1),
        };
      });

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
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
      const previousData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters));

      updateLinksCache(queryClient, filters, (old) => {
        if (!old) return old;
        const idsSet = new Set(ids);
        return {
          links: old.links.filter((link) => !idsSet.has(link.id)),
          total: Math.max(0, old.total - ids.length),
        };
      });

      return { previousData };
    },
    onError: (err, ids, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete links");
    },
    onSuccess: (ids) => {
      toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} moved to trash`);
    },
  });

  /**
   * Batch restore
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
      const previousData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters));

      if (filters.is_deleted) {
        updateLinksCache(queryClient, filters, (old) => {
          if (!old) return old;
          const idsSet = new Set(ids);
          return {
            links: old.links.filter((link) => !idsSet.has(link.id)),
            total: Math.max(0, old.total - ids.length),
          };
        });
      }

      return { previousData };
    },
    onError: (err, ids, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to restore links");
    },
    onSuccess: (ids) => {
      toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} restored`);
    },
  });

  /**
   * Batch permanent delete
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
      const previousData = queryClient.getQueryData<LinksResponse>(queryKeys.links.list(filters));

      updateLinksCache(queryClient, filters, (old) => {
        if (!old) return old;
        const idsSet = new Set(ids);
        return {
          links: old.links.filter((link) => !idsSet.has(link.id)),
          total: Math.max(0, old.total - ids.length),
        };
      });

      return { previousData };
    },
    onError: (err, ids, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.links.list(filters), context.previousData);
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

      // Update cache with new links
      if (createdLinks.length > 0) {
        updateLinksCache(queryClient, filters, (old) => {
          if (!old) return { links: createdLinks, total: createdLinks.length };
          return {
            links: [...createdLinks, ...old.links],
            total: old.total + createdLinks.length,
          };
        });
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
