"use client";

import * as React from "react";
import { toast } from "sonner";
import type { Link, LinkFilters } from "@/features/links/types";
import type { DetectedContent } from "@/lib/content-detector";
import { useLinksStore, selectLinksForView } from "@/features/links/store/links-store";

/**
 * Page size for infinite scroll
 */
const PAGE_SIZE = 100;

interface InitialLinksData {
  links: Link[];
  total: number;
}

/**
 * Simplified useLinks hook
 *
 * Architecture:
 * - Server prefetch provides initial data via initialData prop
 * - Zustand store is the single source of truth
 * - Realtime subscription keeps data fresh (handled by useRealtimeSync)
 * - Mutations update store optimistically, then sync with server
 * - No SWR, no localStorage cache - just server data + realtime
 *
 * Benefits:
 * - Instant navigation (data already in store)
 * - No stale cache issues
 * - No double fetching
 * - Simpler mental model
 */
export function useLinks(
  isAuthenticated: boolean,
  filters?: LinkFilters,
  userId?: string,
  searchQuery: string = "",
  initialData?: InitialLinksData,
) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [currentOffset, setCurrentOffset] = React.useState(initialData?.links.length ?? 0);
  const [isSearching, setIsSearching] = React.useState(false);

  const view: "all" | "trash" = filters?.is_deleted === true ? "trash" : "all";

  // Read from Zustand store
  const storeSlice = useLinksStore((state) => selectLinksForView(state, view));
  const isHydrated = useLinksStore((state) => state.isHydrated);
  const hydrate = useLinksStore((state) => state.hydrate);
  const addLink = useLinksStore((state) => state.addLink);
  const updateLink = useLinksStore((state) => state.updateLink);
  const moveToTrash = useLinksStore((state) => state.moveToTrash);
  const restoreFromTrash = useLinksStore((state) => state.restoreFromTrash);
  const permanentDelete = useLinksStore((state) => state.permanentDelete);
  const batchMoveToTrash = useLinksStore((state) => state.batchMoveToTrash);
  const batchRestoreFromTrash = useLinksStore((state) => state.batchRestoreFromTrash);
  const batchPermanentDelete = useLinksStore((state) => state.batchPermanentDelete);
  const batchUpdateLink = useLinksStore((state) => state.batchUpdateLink);

  // Hydrate store from server prefetch (runs once on mount)
  const hasHydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (initialData && !hasHydratedRef.current) {
      hasHydratedRef.current = true;
      hydrate(view, initialData);
    }
  }, [initialData, view, hydrate]);

  // Build query string for API requests
  const buildQueryString = React.useCallback(
    (offset: number, limit: number = PAGE_SIZE) => {
      const params = new URLSearchParams();
      if (filters?.category_id) params.append("category_id", filters.category_id);
      if (filters?.is_deleted !== undefined) {
        params.append("is_deleted", String(filters.is_deleted));
      }
      if (filters?.is_archived !== undefined) {
        params.append("is_archived", String(filters.is_archived));
      }
      if (filters?.is_deleted === undefined) {
        params.append("is_deleted", "false");
      }
      if (
        filters?.is_archived === undefined &&
        (filters?.is_deleted === false || filters?.is_deleted === undefined)
      ) {
        params.append("is_archived", "false");
      }
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim());
      }
      params.append("limit", String(limit));
      params.append("offset", String(offset));
      return `/api/links?${params.toString()}`;
    },
    [filters, searchQuery],
  );

  // Fetch data from API
  const fetchLinks = React.useCallback(
    async (offset: number, limit: number = PAGE_SIZE): Promise<{ links: Link[]; total: number } | null> => {
      if (!isAuthenticated || !userId) return null;

      const url = buildQueryString(offset, limit);
      const response = await fetch(url);

      if (!response.ok) {
        let errorMessage = "Failed to fetch";
        try {
          const errorData = (await response.json()) as { error?: { userMessage?: string } | string };
          if (typeof errorData.error === "string") {
            errorMessage = errorData.error;
          } else {
            errorMessage = errorData.error?.userMessage ?? "Failed to fetch";
          }
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    [isAuthenticated, userId, buildQueryString],
  );

  // Search effect - fetch fresh data when search query changes
  const previousSearchQuery = React.useRef(searchQuery);
  React.useEffect(() => {
    if (previousSearchQuery.current === searchQuery) return;
    previousSearchQuery.current = searchQuery;

    if (!isAuthenticated || !userId) return;

    const doSearch = async () => {
      setIsSearching(true);
      try {
        const data = await fetchLinks(0, PAGE_SIZE);
        if (data) {
          hydrate(view, data);
          setCurrentOffset(data.links.length);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Search failed";
        toast.error(message);
      } finally {
        setIsSearching(false);
      }
    };

    doSearch();
  }, [searchQuery, isAuthenticated, userId, view, hydrate, fetchLinks]);

  // Read links from store
  const links = storeSlice.links;
  const totalCount = storeSlice.total;
  const hasMore = links.length < totalCount;

  // Determine if we're in a loading state
  // Only show loading when we have no data AND we're not hydrated
  const fetchingLinks = !isHydrated && links.length === 0 && !initialData;

  // Load more handler for infinite scroll
  const loadMore = React.useCallback(async () => {
    if (isLoadingMore || !hasMore || !isAuthenticated || !userId) return;

    setIsLoadingMore(true);
    try {
      const data = await fetchLinks(currentOffset, PAGE_SIZE);
      if (data && data.links.length > 0) {
        // Add new links to store
        data.links.forEach((link) => {
          addLink(link);
        });
        setCurrentOffset((prev) => prev + data.links.length);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load more";
      toast.error(message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, isAuthenticated, userId, currentOffset, fetchLinks, addLink]);

  // Mutation handlers with optimistic updates

  const handleDeleteLink = React.useCallback(
    async (id: string) => {
      moveToTrash(id);

      try {
        const response = await fetch(`/api/links/${id}`, { method: "DELETE" });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: { userMessage?: string } };
          const errorMessage = errorData.error?.userMessage ?? "Failed to delete link";
          throw new Error(errorMessage);
        }

        toast.success("Link moved to trash");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete link";
        toast.error(errorMessage);
        // Realtime will restore correct state
      }
    },
    [moveToTrash],
  );

  const handleRestoreLink = React.useCallback(
    async (id: string) => {
      restoreFromTrash(id);

      try {
        const response = await fetch(`/api/links/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_deleted: false, is_archived: false }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: { userMessage?: string } };
          const errorMessage = errorData.error?.userMessage ?? "Failed to restore link";
          throw new Error(errorMessage);
        }

        toast.success("Link restored");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to restore link";
        toast.error(errorMessage);
        // Realtime will restore correct state
      }
    },
    [restoreFromTrash],
  );

  const handlePermanentDeleteLink = React.useCallback(
    async (id: string) => {
      permanentDelete(id);

      try {
        const response = await fetch(`/api/links/${id}/permanent`, { method: "DELETE" });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: { userMessage?: string } };
          const errorMessage = errorData.error?.userMessage ?? "Failed to permanently delete link";
          throw new Error(errorMessage);
        }

        toast.success("Link permanently deleted");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to permanently delete link";
        toast.error(errorMessage);
        // Realtime will restore correct state
      }
    },
    [permanentDelete],
  );

  const handleBatchRestoreLinks = React.useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;

      batchRestoreFromTrash(ids);

      try {
        const response = await fetch("/api/links/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "restore", ids }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error ?? "Failed to restore links");
        }

        toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} restored`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to restore links";
        toast.error(errorMessage);
      }
    },
    [batchRestoreFromTrash],
  );

  const handleBatchPermanentDeleteLinks = React.useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;

      batchPermanentDelete(ids);

      try {
        const response = await fetch("/api/links/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "permanent_delete", ids }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error ?? "Failed to permanently delete links");
        }

        toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} permanently deleted`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to permanently delete links";
        toast.error(errorMessage);
      }
    },
    [batchPermanentDelete],
  );

  const handleBatchDeleteLinks = React.useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;

      batchMoveToTrash(ids);

      try {
        const response = await fetch("/api/links/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", ids }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error ?? "Failed to delete links");
        }

        toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} moved to trash`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete links";
        toast.error(errorMessage);
      }
    },
    [batchMoveToTrash],
  );

  const handleBatchPinLinks = React.useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;

      batchUpdateLink(ids, { is_pinned: true });

      try {
        const response = await fetch("/api/links/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pin", ids }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error ?? "Failed to pin links");
        }

        toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} pinned`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to pin links";
        toast.error(errorMessage);
      }
    },
    [batchUpdateLink],
  );

  const handleBatchUnpinLinks = React.useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;

      batchUpdateLink(ids, { is_pinned: false });

      try {
        const response = await fetch("/api/links/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unpin", ids }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error ?? "Failed to unpin links");
        }

        toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} unpinned`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to unpin links";
        toast.error(errorMessage);
      }
    },
    [batchUpdateLink],
  );

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

  const handleEditLink = () => {
    toast("Edit functionality coming soon");
  };

  const handleUpdateLink = React.useCallback(
    async (id: string, updates: Partial<Link>) => {
      updateLink(id, updates);

      try {
        const response = await fetch(`/api/links/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: { userMessage?: string } };
          const errorMessage = errorData.error?.userMessage ?? "Failed to update link";
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update link";
        toast.error(errorMessage);
      }
    },
    [updateLink],
  );

  const handlePinLink = React.useCallback(
    async (id: string) => {
      updateLink(id, { is_pinned: true });

      try {
        const response = await fetch(`/api/links/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_pinned: true }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: { userMessage?: string } };
          const errorMessage = errorData.error?.userMessage ?? "Failed to pin link";
          throw new Error(errorMessage);
        }

        toast.success("Link pinned");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to pin link";
        toast.error(errorMessage);
      }
    },
    [updateLink],
  );

  const handleUnpinLink = React.useCallback(
    async (id: string) => {
      updateLink(id, { is_pinned: false });

      try {
        const response = await fetch(`/api/links/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_pinned: false }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: { userMessage?: string } };
          const errorMessage = errorData.error?.userMessage ?? "Failed to unpin link";
          throw new Error(errorMessage);
        }

        toast.success("Link unpinned");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to unpin link";
        toast.error(errorMessage);
      }
    },
    [updateLink],
  );

  const handleSubmit = async (items: DetectedContent[]) => {
    if (items.length === 0) return;

    // Client-side duplicate detection
    const existingUrls = new Set(links.map((link) => link.url.toLowerCase()));
    const seenInBatch = new Set<string>();
    const newItems: DetectedContent[] = [];
    const duplicateItems: DetectedContent[] = [];

    for (const item of items) {
      const normalizedUrl = item.value.toLowerCase();

      if (existingUrls.has(normalizedUrl) || seenInBatch.has(normalizedUrl)) {
        duplicateItems.push(item);
      } else {
        newItems.push(item);
        seenInBatch.add(normalizedUrl);
      }
    }

    if (newItems.length === 0) {
      showSubmitToast(items.length, 0, duplicateItems.length, 0, 0, items[0]?.type);
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading(`Adding ${newItems.length} ${newItems.length === 1 ? "item" : "items"}...`);

    try {
      const linksToAdd = newItems.map(({ value, type }) => ({
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
        let errorMessage = "Failed to add links";
        try {
          const errorData = (await response.json()) as { error?: string };
          errorMessage = errorData.error ?? "Failed to add links";
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const responseData = (await response.json()) as { links?: Link[]; count?: number; restored?: number };
      const createdLinks = responseData.links ?? [];
      const count = responseData.count ?? createdLinks.length;
      const restored = responseData.restored ?? 0;

      // Add all links to store
      createdLinks.forEach((link) => {
        addLink(link);
      });

      toast.dismiss(toastId);

      const successCount = count - restored;
      showSubmitToast(items.length, successCount, duplicateItems.length, restored, 0, items[0]?.type);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    links,
    filteredLinks: links,
    isLoading,
    fetchingLinks: fetchingLinks || isSearching,
    handleSubmit,
    handleDeleteLink,
    handleRestoreLink,
    handlePermanentDeleteLink,
    handleCopyUrl,
    handleEditLink,
    handleUpdateLink,
    handlePinLink,
    handleUnpinLink,
    handleBatchDeleteLinks,
    handleBatchRestoreLinks,
    handleBatchPermanentDeleteLinks,
    handleBatchPinLinks,
    handleBatchUnpinLinks,
    hasMore,
    loadMore,
    isLoadingMore,
  };
}

/**
 * Helper function to show appropriate toast message based on results
 */
function showSubmitToast(
  totalItems: number,
  successCount: number,
  duplicateCount: number,
  restoredCount: number,
  failureCount: number,
  contentType?: string,
) {
  if (totalItems === 1) {
    if (restoredCount === 1) {
      const message = contentType === "color" ? "Color restored from trash" : "Link restored from trash";
      toast.success(message);
    } else if (successCount === 1) {
      const message = contentType === "color" ? "Color saved successfully" : "Link saved successfully";
      toast.success(message);
    } else if (duplicateCount === 1) {
      const message =
        contentType === "color"
          ? "This color is already in your list"
          : contentType === "url"
            ? "This link is already in your list"
            : "This item is already in your list";
      toast(message);
    } else {
      toast.error("Failed to save");
    }
  } else {
    const parts: string[] = [];

    if (successCount > 0) {
      parts.push(`${successCount} added`);
    }
    if (restoredCount > 0) {
      parts.push(`${restoredCount} restored from trash`);
    }
    if (duplicateCount > 0) {
      parts.push(`${duplicateCount} already in list`);
    }
    if (failureCount > 0) {
      parts.push(`${failureCount} failed`);
    }

    if (failureCount > 0 && successCount === 0 && restoredCount === 0) {
      toast.error("Failed to add links");
    } else if (parts.length > 0) {
      toast.success(parts.join(", "));
    }
  }
}
