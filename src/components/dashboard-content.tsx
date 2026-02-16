"use client";

import * as React from "react";
import { LinkList } from "@/components/link-list";
import { LinkListSkeleton } from "@/components/skeletons";
import { useLinksQuery } from "@/features/links/queries/use-links-query";
import { useSearchLinks } from "@/features/links/hooks/use-search-links";
import { useLinkMutations, useCopyUrl } from "@/features/links/queries/use-link-mutations";
import { useSpaces } from "@/features/spaces/queries";
import type { User } from "@supabase/supabase-js";
import type { Link, LinkFilters } from "@/features/links/types";
import type { SmartSearchChip } from "@/features/search/types/smart-search.types";
import {
  applySmartSearchFilters,
  buildSmartEffectiveQuery,
  buildSmartKeywordQuery,
} from "@/features/search/lib/smart-search-filters";
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
  plannerRewrittenQuery?: string;
  smartChips?: SmartSearchChip[];
  timezone?: string;
  viewMode?: "list" | "grid";
  onImageUploadReady?: (handler: (files: File[]) => void) => void;
  onDocumentUploadReady?: (handler: (files: File[]) => void) => void;
  onCreateNoteReady?: (handler: (payload: { title: string; html: string; plainText: string }) => Promise<unknown>) => void;
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
  plannerRewrittenQuery = "",
  smartChips = [],
  timezone = "UTC",
  viewMode = "list",
  onImageUploadReady,
  onDocumentUploadReady,
  onCreateNoteReady,
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

  // Fetch all links for the current filter (no server-side search)
  const {
    links: allLinks,
    isLoading,
    isFetching,
  } = useLinksQuery(filters, !!user);

  const smartFilteredLinks = React.useMemo(() => {
    if (smartChips.length === 0) {
      return allLinks;
    }

    return applySmartSearchFilters(allLinks, smartChips, {
      timezone,
      linkSpacesMap,
    });
  }, [allLinks, linkSpacesMap, smartChips, timezone]);

  const hasRelaxableTypeChip = React.useMemo(
    () => smartChips.some((chip) => chip.kind === "content_type" && chip.value === "url"),
    [smartChips]
  );

  const relaxedSmartChips = React.useMemo(() => {
    if (!hasRelaxableTypeChip) {
      return smartChips;
    }
    return smartChips.filter(
      (chip) => !(chip.kind === "content_type" && chip.value === "url")
    );
  }, [hasRelaxableTypeChip, smartChips]);

  const relaxedSmartFilteredLinks = React.useMemo(() => {
    if (!hasRelaxableTypeChip || relaxedSmartChips.length === smartChips.length) {
      return smartFilteredLinks;
    }

    return applySmartSearchFilters(allLinks, relaxedSmartChips, {
      timezone,
      linkSpacesMap,
    });
  }, [
    allLinks,
    hasRelaxableTypeChip,
    linkSpacesMap,
    relaxedSmartChips,
    smartChips.length,
    smartFilteredLinks,
    timezone,
  ]);

  const effectiveSearchQuery = React.useMemo(() => {
    const keywordQuery = buildSmartKeywordQuery(smartChips);
    return buildSmartEffectiveQuery({
      rewrittenQuery: plannerRewrittenQuery,
      keywordQuery,
      liveQuery: searchQuery,
      chips: smartChips,
    });
  }, [plannerRewrittenQuery, searchQuery, smartChips]);

  const strictLinks = useSearchLinks(smartFilteredLinks, effectiveSearchQuery, spaces, linkSpacesMap);
  const relaxedLinks = useSearchLinks(
    relaxedSmartFilteredLinks,
    effectiveSearchQuery,
    spaces,
    linkSpacesMap
  );

  // If strict chips produce zero results, relax weak "url/links" type constraint.
  const links = React.useMemo(() => {
    if (!hasRelaxableTypeChip || strictLinks.length > 0) {
      return strictLinks;
    }
    return relaxedLinks;
  }, [hasRelaxableTypeChip, relaxedLinks, strictLinks]);

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

  // Stable key that only changes when the set of link IDs changes
  // (not when link data like titles/descriptions are updated)
  const linkIdsKey = React.useMemo(() => {
    if (allLinks.length === 0) return "";
    return allLinks.map(l => l.id).sort().join(",");
  }, [allLinks]);

  // Fetch link-space mappings using the FULL link set (not the filtered one)
  // so that space-name search works correctly for all links
  React.useEffect(() => {
    if (!user || linkIdsKey === "") return;

    const fetchLinkSpaces = async () => {
      const supabase = createClient();
      const linkIds = linkIdsKey.split(",");

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
  }, [user, linkIdsKey]);

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

  const isSearchMode = effectiveSearchQuery.trim().length > 0;

  // Preserve relevance order from useSearchLinks during search mode.
  const displayLinks = React.useMemo(() => {
    if (isSearchMode) {
      return links;
    }

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
  }, [isSearchMode, links, sortBy, sortOrder]);

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
  // Use allLinks (pre-search) so an empty search result doesn't trigger the skeleton
  const showSkeleton = isLoading || (isFetching && allLinks.length === 0);
  if (showSkeleton) {
    return <LinkListSkeleton />;
  }

  return (
    <LinkList
      links={displayLinks}
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
      viewMode={viewMode}
    />
  );
}
