"use client";

import * as React from "react";
import { LinkList } from "@/components/link-list";
import { LinkListSkeleton } from "@/components/skeletons";
import { useLinksQuery } from "@/features/links/queries/use-links-query";
import { useSearchLinks } from "@/features/links/hooks/use-search-links";
import { useLinkMutations, useCopyUrl } from "@/features/links/queries/use-link-mutations";
import type { User } from "@supabase/supabase-js";
import type { Link, LinkFilters } from "@/features/links/types";
import type { Space } from "@/types";
import {
  detectMultipleContentTypes,
} from "@/lib/content-detector";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface BatchHandlers {
  onBatchDelete: (ids: string[]) => Promise<void>;
  onBatchRestore: (ids: string[]) => Promise<void>;
  onBatchPermanentDelete: (ids: string[]) => Promise<void>;
  onBatchPin: (ids: string[]) => Promise<void>;
  onBatchUnpin: (ids: string[]) => Promise<void>;
  onBatchAddToSpace: (spaceId: string, ids: string[]) => Promise<void>;
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
  viewMode?: "list" | "grid";
  onImageUploadReady?: (handler: (files: File[]) => void) => void;
  onDocumentUploadReady?: (handler: (files: File[]) => void) => void;
  onCreateNoteReady?: (handler: (payload: { title: string; html: string; plainText: string }) => Promise<unknown>) => void;
  spaces: Space[];
  onAddLinksToSpace: (spaceId: string, linkIds: string[]) => Promise<boolean>;
  onRemoveLinksFromSpace: (spaceId: string, linkIds: string[]) => Promise<boolean>;
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
  viewMode = "list",
  onImageUploadReady,
  onDocumentUploadReady,
  onCreateNoteReady,
  spaces,
  onAddLinksToSpace,
  onRemoveLinksFromSpace,
}: DashboardContentProps) {
  const PAGE_SIZE = 100;
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

  // Fetch all links for the current filter (no server-side search)
  const {
    links: allLinks,
    isLoading,
    isFetching,
  } = useLinksQuery(filters, !!user, undefined, searchQuery, PAGE_SIZE);

  // Client-side instant search — filters in memory, no network round-trip
  const links = useSearchLinks(allLinks, searchQuery, spaces, linkSpacesMap);

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
    addImageFiles,
    addDocumentFiles,
    addNote,
    isAddingLinks,
    isUploadingImages,
  } = useLinkMutations(filters);

  // Copy URL utility
  const { copyUrl } = useCopyUrl();

  // Expose image upload handler to parent
  React.useEffect(() => {
    onImageUploadReady?.(addImageFiles);
  }, [onImageUploadReady, addImageFiles]);

  React.useEffect(() => {
    onDocumentUploadReady?.(addDocumentFiles);
  }, [onDocumentUploadReady, addDocumentFiles]);

  React.useEffect(() => {
    onCreateNoteReady?.(addNote);
  }, [onCreateNoteReady, addNote]);

  const linksContextKey = React.useMemo(
    () => JSON.stringify({ selectedCategoryId, q: searchQuery.trim() }),
    [selectedCategoryId, searchQuery]
  );
  const fetchedLinkSpaceIdsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    fetchedLinkSpaceIdsRef.current = new Set();
    setLinkSpacesMap(new Map());
  }, [linksContextKey]);

  // Incrementally fetch link-space mappings only for links not yet fetched in the current view/search context.
  React.useEffect(() => {
    if (!user || allLinks.length === 0) return;

    const fetchLinkSpaces = async () => {
      const supabase = createClient();
      const pendingLinkIds = allLinks
        .map((link) => link.id)
        .filter((id) => !fetchedLinkSpaceIdsRef.current.has(id));

      if (pendingLinkIds.length === 0) return;

      const nextBatch = pendingLinkIds.slice(0, 200);
      nextBatch.forEach((id) => fetchedLinkSpaceIdsRef.current.add(id));

      const { data } = await supabase
        .from("link_spaces")
        .select("link_id, space_id")
        .in("link_id", nextBatch);

      if (data) {
        setLinkSpacesMap((prev) => {
          const map = new Map(prev);
          data.forEach((ls) => {
            const existing = map.get(ls.link_id) || [];
            if (!existing.includes(ls.space_id)) {
              map.set(ls.link_id, [...existing, ls.space_id]);
            }
          });
          return map;
        });
      }
    };

    fetchLinkSpaces();
  }, [user, allLinks]);

  const handleAddToSpace = React.useCallback(async (linkId: string, spaceId: string) => {
    await onAddLinksToSpace(spaceId, [linkId]);
    // Update local map
    setLinkSpacesMap(prev => {
      const updated = new Map(prev);
      const existing = updated.get(linkId) || [];
      if (!existing.includes(spaceId)) {
        updated.set(linkId, [...existing, spaceId]);
      }
      return updated;
    });
  }, [onAddLinksToSpace]);

  const handleRemoveFromSpace = React.useCallback(async (linkId: string, spaceId: string) => {
    await onRemoveLinksFromSpace(spaceId, [linkId]);
    // Update local map
    setLinkSpacesMap(prev => {
      const updated = new Map(prev);
      const existing = updated.get(linkId) || [];
      updated.set(linkId, existing.filter(id => id !== spaceId));
      return updated;
    });
  }, [onRemoveLinksFromSpace]);

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

      const uniqueItems = validItems.filter((item, index, array) => {
        const normalizedValue = item.type === "url"
          ? item.value.toLowerCase()
          : item.value.trim().toLowerCase();
        return array.findIndex((candidate) => {
          const candidateValue = candidate.type === "url"
            ? candidate.value.toLowerCase()
            : candidate.value.trim().toLowerCase();
          return candidate.type === item.type && candidateValue === normalizedValue;
        }) === index;
      });

      addLinks(uniqueItems);
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
    await updateLink(id, updates);
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

  const handleBatchAddToSpace = React.useCallback(async (spaceId: string, ids: string[]) => {
    if (ids.length === 0) return;

    const didAdd = await onAddLinksToSpace(spaceId, ids);
    if (!didAdd) return;

    // Keep the local link-space map in sync for immediate UI feedback.
    setLinkSpacesMap(prev => {
      const updated = new Map(prev);
      ids.forEach((linkId) => {
        const existing = updated.get(linkId) || [];
        if (!existing.includes(spaceId)) {
          updated.set(linkId, [...existing, spaceId]);
        }
      });
      return updated;
    });
  }, [onAddLinksToSpace]);

  // Show skeleton when:
  // 1. Initial load for this query key (isLoading)
  // 2. Filter changed to one with no cached data (fetching but empty)
  // Use allLinks (pre-search) so an empty search result doesn't trigger the skeleton
  const showSkeleton = isLoading || (isFetching && allLinks.length === 0);
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
      onBatchAddToSpace={handleBatchAddToSpace}
      onUpdate={handleUpdateLink}
      isTrashView={selectedCategoryId === "trash"}
      isAddingItem={isAddingItem && selectedCategoryId !== "trash"}
      addInputValue={addInputValue}
      onAddInputChange={onAddInputChange}
      onAddSubmit={handleInlineAddSubmit}
      onAddCancel={onAddCancel}
      hasMore={false}
      onLoadMore={() => {}}
      isLoadingMore={false}
      onSelectionChange={onSelectionChange}
      spaces={spaces}
      linkSpacesMap={linkSpacesMap}
      onAddToSpace={handleAddToSpace}
      onRemoveFromSpace={handleRemoveFromSpace}
      viewMode={viewMode}
    />
  );
}
