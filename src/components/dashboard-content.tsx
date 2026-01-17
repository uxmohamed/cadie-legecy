"use client";

import * as React from "react";
import { LinkList } from "@/components/link-list";
import { LinkListSkeleton } from "@/components/skeletons";
import { useLinksQuery } from "@/features/links/queries/use-links-query";
import { useLinkMutations, useCopyUrl } from "@/features/links/queries/use-link-mutations";
import { useSpaces } from "@/features/spaces/queries";
import type { User } from "@supabase/supabase-js";
import type { Link, LinkFilters } from "@/features/links/types";
import {
  detectMultipleContentTypes,
} from "@/lib/content-detector";
import { toast } from "sonner";

export interface BatchHandlers {
  onBatchDelete: (ids: string[]) => Promise<void>;
  onBatchRestore: (ids: string[]) => Promise<void>;
  onBatchPermanentDelete: (ids: string[]) => Promise<void>;
  onBatchPin: (ids: string[]) => Promise<void>;
  onBatchUnpin: (ids: string[]) => Promise<void>;
}

interface DashboardContentProps {
  user: User;
  selectedCategoryId: string | null;
  sortBy: "date" | "title";
  sortOrder: "asc" | "desc";
  isAddingItem: boolean;
  addInputValue: string;
  onAddInputChange: (value: string) => void;
  onAddSubmit: () => void;
  onAddCancel: () => void;
  onSelectionChange: (count: number, links: Link[], clearSelection: () => void, batchHandlers: BatchHandlers) => void;
  searchQuery: string;
}

export function DashboardContent({
  user,
  selectedCategoryId,
  sortBy,
  sortOrder,
  isAddingItem,
  addInputValue,
  onAddInputChange,
  onAddSubmit,
  onAddCancel,
  onSelectionChange,
  searchQuery,
}: DashboardContentProps) {
  const { spaces, addLinksToSpace, removeLinksFromSpace } = useSpaces(!!user);
  const [linkSpacesMap, setLinkSpacesMap] = React.useState<Map<string, string[]>>(new Map());

  // Memoize filters to prevent cache misses
  const filters: LinkFilters = React.useMemo(() => {
    if (selectedCategoryId === "trash") {
      return { is_deleted: true };
    }
    // If selectedCategoryId is a UUID (space ID), filter by space
    if (selectedCategoryId && selectedCategoryId !== "trash" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedCategoryId)) {
      return { space_id: selectedCategoryId, is_deleted: false, is_archived: false };
    }
    return { is_deleted: false, is_archived: false };
  }, [selectedCategoryId]);

  // Debounce the search query to avoid too many API requests
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState(searchQuery);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use TanStack Query for links
  const {
    links,
    isLoading,
    isFetching,
  } = useLinksQuery(filters, debouncedSearchQuery, !!user);

  // Use mutations hook
  const {
    deleteLink,
    restoreLink,
    permanentDeleteLink,
    updateLink,
    pinLink,
    unpinLink,
    batchDeleteLinks,
    batchRestoreLinks,
    batchPermanentDeleteLinks,
    batchPinLinks,
    batchUnpinLinks,
    addLinks,
    isAddingLinks,
  } = useLinkMutations(filters);

  // Copy URL utility
  const { copyUrl } = useCopyUrl();

  // Fetch link spaces for all links
  React.useEffect(() => {
    if (!user || links.length === 0) return;

    const fetchLinkSpaces = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const linkIds = links.map(l => l.id);
      
      const { data } = await supabase
        .from("link_spaces")
        .select("link_id, space_id")
        .in("link_id", linkIds);

      if (data) {
        const map = new Map<string, string[]>();
        data.forEach((ls) => {
          const existing = map.get(ls.link_id) || [];
          map.set(ls.link_id, [...existing, ls.space_id]);
        });
        setLinkSpacesMap(map);
      }
    };

    fetchLinkSpaces();
  }, [user, links]);

  const handleAddToSpace = React.useCallback(async (linkId: string, spaceId: string) => {
    await addLinksToSpace(spaceId, [linkId]);
    // Update local map
    setLinkSpacesMap(prev => {
      const updated = new Map(prev);
      const existing = updated.get(linkId) || [];
      if (!existing.includes(spaceId)) {
        updated.set(linkId, [...existing, spaceId]);
      }
      return updated;
    });
  }, [addLinksToSpace]);

  const handleRemoveFromSpace = React.useCallback(async (linkId: string, spaceId: string) => {
    await removeLinksFromSpace(spaceId, [linkId]);
    // Update local map
    setLinkSpacesMap(prev => {
      const updated = new Map(prev);
      const existing = updated.get(linkId) || [];
      updated.set(linkId, existing.filter(id => id !== spaceId));
      return updated;
    });
  }, [removeLinksFromSpace]);

  // Sort links based on current sort settings
  const sortedLinks = React.useMemo(() => {
    const pinned = links.filter((link) => link.is_pinned);
    const unpinned = links.filter((link) => !link.is_pinned);

    const sortFunction = (a: Link, b: Link) => {
      if (sortBy === "date") {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        if (sortOrder === "asc") {
          return titleA.localeCompare(titleB);
        } else {
          return titleB.localeCompare(titleA);
        }
      }
    };

    pinned.sort(sortFunction);
    unpinned.sort(sortFunction);

    return [...pinned, ...unpinned];
  }, [links, sortBy, sortOrder]);

  const handleInlineAddSubmit = React.useCallback(() => {
    if (!addInputValue.trim() || isAddingLinks) return;

    const detectedItems = detectMultipleContentTypes(addInputValue);
    if (detectedItems.length > 0) {
      const validItems = detectedItems.filter(item => {
        if (item.type === 'url') {
          try {
            const url = new URL(item.value);
            return url.hostname === 'localhost' || url.hostname.includes('.');
          } catch {
            return false;
          }
        }
        return true;
      });

      if (validItems.length === 0) {
        toast.error("Please enter a valid URL or color");
        return;
      }

      if (validItems.length < detectedItems.length) {
        toast.warning("Some invalid items were skipped");
      }

      addLinks(validItems);
      onAddSubmit();
    }
  }, [addInputValue, isAddingLinks, addLinks, onAddSubmit]);

  // Wrapper functions to match expected signatures (async for LinkList types)
  const handleDeleteLink = React.useCallback(async (id: string) => {
    deleteLink(id);
  }, [deleteLink]);

  const handleRestoreLink = React.useCallback(async (id: string) => {
    restoreLink(id);
  }, [restoreLink]);

  const handlePermanentDeleteLink = React.useCallback(async (id: string) => {
    permanentDeleteLink(id);
  }, [permanentDeleteLink]);

  const handleUpdateLink = React.useCallback(async (id: string, updates: Partial<Link>) => {
    updateLink(id, updates);
  }, [updateLink]);

  const handlePinLink = React.useCallback(async (id: string) => {
    pinLink(id);
  }, [pinLink]);

  const handleUnpinLink = React.useCallback(async (id: string) => {
    unpinLink(id);
  }, [unpinLink]);

  const handleEditLink = React.useCallback(() => {
    toast("Edit functionality coming soon");
  }, []);

  // Batch handlers returning promises for DashboardClient compatibility
  const handleBatchDeleteLinks = React.useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    batchDeleteLinks(ids);
  }, [batchDeleteLinks]);

  const handleBatchRestoreLinks = React.useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    batchRestoreLinks(ids);
  }, [batchRestoreLinks]);

  const handleBatchPermanentDeleteLinks = React.useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    batchPermanentDeleteLinks(ids);
  }, [batchPermanentDeleteLinks]);

  const handleBatchPinLinks = React.useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    batchPinLinks(ids);
  }, [batchPinLinks]);

  const handleBatchUnpinLinks = React.useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    batchUnpinLinks(ids);
  }, [batchUnpinLinks]);

  // Create stable batch handlers that accept IDs as parameters
  // These are passed to onSelectionChange and stored in DashboardClient
  const batchHandlers: BatchHandlers = React.useMemo(() => ({
    onBatchDelete: handleBatchDeleteLinks,
    onBatchRestore: handleBatchRestoreLinks,
    onBatchPermanentDelete: handleBatchPermanentDeleteLinks,
    onBatchPin: handleBatchPinLinks,
    onBatchUnpin: handleBatchUnpinLinks,
  }), [handleBatchDeleteLinks, handleBatchRestoreLinks, handleBatchPermanentDeleteLinks, handleBatchPinLinks, handleBatchUnpinLinks]);

  // Show skeleton when:
  // 1. Initial load for this query key (isLoading)
  // 2. Filter changed to one with no cached data (fetching but empty)
  // This prevents showing stale data from a different filter during navigation
  const showSkeleton = isLoading || (isFetching && links.length === 0);
  if (showSkeleton) {
    return <LinkListSkeleton />;
  }

  return (
    <LinkList
      links={sortedLinks}
      onDelete={handleDeleteLink}
      onRestore={handleRestoreLink}
      onPermanentDelete={handlePermanentDeleteLink}
      onEdit={handleEditLink}
      onCopy={copyUrl}
      onPin={handlePinLink}
      onUnpin={handleUnpinLink}
      onBatchDelete={handleBatchDeleteLinks}
      onBatchRestore={handleBatchRestoreLinks}
      onBatchPermanentDelete={handleBatchPermanentDeleteLinks}
      onBatchPin={handleBatchPinLinks}
      onBatchUnpin={handleBatchUnpinLinks}
      onUpdate={handleUpdateLink}
      isTrashView={selectedCategoryId === "trash"}
      isAddingItem={isAddingItem && selectedCategoryId !== "trash"}
      addInputValue={addInputValue}
      onAddInputChange={onAddInputChange}
      onAddSubmit={handleInlineAddSubmit}
      onAddCancel={onAddCancel}
      isLoadingMore={false} // Never show bottom skeleton - background updates are silent
      hasMore={false} // TODO: Implement infinite scroll with useLinksInfiniteQuery
      onLoadMore={() => {}} // TODO: Implement infinite scroll
      onSelectionChange={onSelectionChange}
      spaces={spaces}
      linkSpacesMap={linkSpacesMap}
      onAddToSpace={handleAddToSpace}
      onRemoveFromSpace={handleRemoveFromSpace}
    />
  );
}
