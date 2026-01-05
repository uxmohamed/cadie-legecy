"use client";

import * as React from "react";
import useSWRInfinite from "swr/infinite";
import { toast } from "sonner";
import type { Link, CreateLinkDTO, LinkFilters } from "@/features/links/types";
import type { DetectedContent } from "@/lib/content-detector";
import { useLinksStore, selectLinksForView } from "@/features/links/store/links-store";

/**
 * Fetcher function for SWR
 * Strips hash fragment from URL (used for cache isolation, not sent to API)
 */
async function fetcher<T>(url: string): Promise<T> {
  const fetchUrl = url.split("#")[0];
  const response = await fetch(fetchUrl);

  if (!response.ok) {
    let errorMessage = "Failed to fetch";
    try {
      const errorData = (await response.json()) as { error?: { userMessage?: string } | string };
      if (typeof errorData.error === "string") {
        errorMessage = errorData.error;
      } else {
        errorMessage =
          errorData.error?.userMessage != null ? errorData.error.userMessage : "Failed to fetch";
      }
    } catch {
      errorMessage = `Server error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

interface InitialLinksData {
  links: Link[];
  total: number;
}

const PAGE_SIZE = 100;

export function useLinks(
  isAuthenticated: boolean,
  filters?: LinkFilters,
  userId?: string,
  searchQuery: string = "",
  initialData?: InitialLinksData,
) {
  const [isLoading, setIsLoading] = React.useState(false);

  const view: "all" | "trash" =
    filters?.is_deleted === true ? "trash" : "all";

  const storeSlice = useLinksStore((state) => selectLinksForView(state, view));
  const addLink = useLinksStore((state) => state.addLink);
  const updateLink = useLinksStore((state) => state.updateLink);
  const moveToTrash = useLinksStore((state) => state.moveToTrash);
  const restoreFromTrash = useLinksStore((state) => state.restoreFromTrash);
  const permanentDelete = useLinksStore((state) => state.permanentDelete);
  const batchMoveToTrash = useLinksStore((state) => state.batchMoveToTrash);
  const batchRestoreFromTrash = useLinksStore(
    (state) => state.batchRestoreFromTrash,
  );
  const batchPermanentDelete = useLinksStore(
    (state) => state.batchPermanentDelete,
  );
  const batchUpdateLink = useLinksStore((state) => state.batchUpdateLink);

  const buildQueryString = React.useCallback(
    (
      index: number,
      previousPageData: { links: Link[]; total: number } | null,
    ) => {
      if (!isAuthenticated || !userId) return null;
      if (previousPageData && previousPageData.links.length === 0) return null;

      const params = new URLSearchParams();
      if (filters?.space_id) params.append("space_id", filters.space_id);
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

      params.append("limit", String(PAGE_SIZE));
      params.append("offset", String(index * PAGE_SIZE));

      return `/api/links?${params.toString()}#user=${userId}`;
    },
    [filters, isAuthenticated, searchQuery, userId],
  );

  const fallbackData = React.useMemo(() => {
    if (!initialData || initialData.links.length === 0) return undefined;
    if (searchQuery.trim()) return undefined;
    return [initialData];
  }, [initialData, searchQuery]);

  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate,
  } = useSWRInfinite<{ links: Link[]; total: number }>(buildQueryString, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateOnMount: !fallbackData,
    revalidateIfStale: true,
    dedupingInterval: 2000,
    fallbackData,
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to load links";
      toast.error(message);
    },
  });

  React.useEffect(() => {
    if (!data) return;
    const flatLinks = data.flatMap((page) => page.links);
    const total = data[0]?.total ?? flatLinks.length;
    useLinksStore.getState().setFromSWR(view, {
      links: flatLinks,
      total,
    });
  }, [data, view]);

  const links = storeSlice.links;
  const totalCount = storeSlice.total;

  const isLoadingMore = isValidating && size > 1 && data && data.length > 0;
  const hasMore = links.length < totalCount;

  const fetchingLinks =
    isValidating && links.length === 0 && !fallbackData;

  const loadMore = React.useCallback(() => {
    if (!isValidating && hasMore) {
      setSize(size + 1);
    }
  }, [hasMore, isValidating, setSize, size]);

  const refreshLinks = React.useCallback(async () => {
    try {
      await mutate();
    } catch {
      toast.error("Failed to refresh links");
    }
  }, [mutate]);

  const filteredLinks = links;

  const handleDeleteLink = React.useCallback(
        async (id: string) => {
            moveToTrash(id);

            try {
                const response = await fetch(`/api/links/${id}`, { method: "DELETE" });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    const errorMessage = errorData.error?.userMessage || "Failed to delete link";
                    throw new Error(errorMessage);
                }

                toast.success("Link moved to trash");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to delete link";
                toast.error(errorMessage);
                await refreshLinks();
            }
        },
        [moveToTrash, refreshLinks]
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
                    const errorData = (await response.json()) as any;
                    const errorMessage = errorData.error?.userMessage || "Failed to restore link";
                    throw new Error(errorMessage);
                }

                toast.success("Link restored");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to restore link";
                toast.error(errorMessage);
                await refreshLinks();
            }
        },
        [refreshLinks, restoreFromTrash]
    );

  const handlePermanentDeleteLink = React.useCallback(
        async (id: string) => {
            permanentDelete(id);

            try {
                const response = await fetch(`/api/links/${id}/permanent`, { method: "DELETE" });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    const errorMessage = errorData.error?.userMessage || "Failed to permanently delete link";
                    throw new Error(errorMessage);
                }

                toast.success("Link permanently deleted");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to permanently delete link";
                toast.error(errorMessage);
                await refreshLinks();
            }
        },
        [permanentDelete, refreshLinks]
    );

    const handleBatchRestoreLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            batchRestoreFromTrash(ids);

            try {
                const response = await fetch('/api/links/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'restore', ids }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    throw new Error(errorData.error || 'Failed to restore links');
                }

                toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} restored`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to restore links';
                toast.error(errorMessage);
                await refreshLinks();
            }
        },
        [batchRestoreFromTrash, refreshLinks]
    );

    const handleBatchPermanentDeleteLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            batchPermanentDelete(ids);

            try {
                const response = await fetch('/api/links/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'permanent_delete', ids }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    throw new Error(errorData.error || 'Failed to permanently delete links');
                }

                toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} permanently deleted`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to permanently delete links';
                toast.error(errorMessage);
                await refreshLinks();
            }
        },
        [batchPermanentDelete, refreshLinks]
    );



    const handleBatchDeleteLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            batchMoveToTrash(ids);

            try {
                const response = await fetch('/api/links/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', ids }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    throw new Error(errorData.error || 'Failed to delete links');
                }

                toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} moved to trash`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to delete links';
                toast.error(errorMessage);
                await refreshLinks();
            }
        },
        [batchMoveToTrash, refreshLinks]
    );

    const handleBatchPinLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            batchUpdateLink(ids, { is_pinned: true });

            try {
                const response = await fetch('/api/links/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'pin', ids }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    throw new Error(errorData.error || 'Failed to pin links');
                }

                toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} pinned`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to pin links';
                toast.error(errorMessage);
                await refreshLinks();
            }
        },
        [batchUpdateLink, refreshLinks]
    );

    const handleBatchUnpinLinks = React.useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;

            batchUpdateLink(ids, { is_pinned: false });

            try {
                const response = await fetch('/api/links/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'unpin', ids }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as any;
                    throw new Error(errorData.error || 'Failed to unpin links');
                }

                toast.success(`${ids.length} ${ids.length === 1 ? "link" : "links"} unpinned`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to unpin links';
                toast.error(errorMessage);
                await refreshLinks();
            }
        },
        [batchUpdateLink, refreshLinks]
    );

    const handleCopyUrl = async (url: string, isColor?: boolean) => {
        try {
            await navigator.clipboard.writeText(url);
            // Auto-detect color by checking for hex format
            const isColorValue = isColor ?? /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(url);
            toast.success(isColorValue ? "Color copied to clipboard" : "URL copied to clipboard");
        } catch (error) {
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
                    const errorData = (await response.json()) as any;
                    const errorMessage = errorData.error?.userMessage || "Failed to update link";
                    throw new Error(errorMessage);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to update link";
                toast.error(errorMessage);
                await refreshLinks();
            }
        },
        [updateLink, refreshLinks]
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
                    const errorData = (await response.json()) as any;
                    const errorMessage = errorData.error?.userMessage || "Failed to pin link";
                    throw new Error(errorMessage);
                }

                toast.success("Link pinned");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to pin link";
                toast.error(errorMessage);
                await refreshLinks();
            }
        },
        [updateLink, refreshLinks]
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
                    const errorData = (await response.json()) as any;
                    const errorMessage = errorData.error?.userMessage || "Failed to unpin link";
                    throw new Error(errorMessage);
                }

                toast.success("Link unpinned");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to unpin link";
                toast.error(errorMessage);
                await refreshLinks();
            }
        },
        [updateLink, refreshLinks]
    );

    const handleSubmit = async (items: DetectedContent[]) => {
        if (items.length === 0) return;

        // Client-side duplicate detection - check against existing links AND within the batch
        const existingUrls = new Set(links.map((link) => link.url.toLowerCase()));
        const seenInBatch = new Set<string>();
        const newItems: DetectedContent[] = [];
        const duplicateItems: DetectedContent[] = [];

        for (const item of items) {
            const normalizedUrl = item.value.toLowerCase();

            // Check if duplicate of existing link or already seen in this batch
            if (existingUrls.has(normalizedUrl) || seenInBatch.has(normalizedUrl)) {
                duplicateItems.push(item);
            } else {
                newItems.push(item);
                seenInBatch.add(normalizedUrl);
            }
        }

        // If all items are duplicates, show toast and return early (no server call)
        if (newItems.length === 0) {
            showSubmitToast(
                items.length,
                0, // successCount
                duplicateItems.length,
                0, // restored
                0, // failures
                items[0]?.type
            );
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading(`Adding ${newItems.length} ${newItems.length === 1 ? 'item' : 'items'}...`);

        try {
            // Convert DetectedContent to links array for batch API (only new items)
            const linksToAdd = newItems.map(({ value, type }) => ({
                url: value,
                title: value,
                content_type: type,
                color_value: type === "color" ? value : undefined,
            }));

            // Single atomic batch request
            const response = await fetch('/api/links/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', links: linksToAdd }),
            });

            if (!response.ok) {
                // Safely try to parse JSON error, fall back to status text if HTML is returned
                let errorMessage = 'Failed to add links';
                try {
                    const errorData = (await response.json()) as any;
                    errorMessage = errorData.error || 'Failed to add links';
                } catch {
                    // Response was not JSON (likely HTML error page)
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const responseData = (await response.json()) as { links?: Link[], count?: number, restored?: number };
            const createdLinks = responseData.links || [];
            const count = responseData.count || createdLinks.length;
            const restored = responseData.restored || 0;

            // Add all links to store
            if (createdLinks && createdLinks.length > 0) {
                createdLinks.forEach((link) => {
                    addLink(link);
                });
            }

            toast.dismiss(toastId);

            // Calculate success count (new links only, not restored)
            const successCount = count - restored;

            // Use the comprehensive toast helper (include client-side detected duplicates)
            showSubmitToast(
                items.length,
                successCount,
                duplicateItems.length,
                restored,
                0, // failures
                items[0]?.type
            );
        } catch (error) {
            toast.dismiss(toastId);
            toast.error(
                error instanceof Error ? error.message : "Failed to save"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return {
        links,
        filteredLinks,
        isLoading,
        fetchingLinks,
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
    contentType?: string
) {
    if (totalItems === 1) {
        if (restoredCount === 1) {
            const message =
                contentType === "color"
                    ? "Color restored from trash"
                    : "Link restored from trash";
            toast.success(message);
        } else if (successCount === 1) {
            const message =
                contentType === "color"
                    ? "Color saved successfully"
                    : "Link saved successfully";
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
