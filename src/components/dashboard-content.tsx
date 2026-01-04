"use client";

import * as React from "react";
import { LinkList } from "@/components/link-list";
import { LinkListSkeleton } from "@/components/skeletons";
import { useLinks, usePrefetchView } from "@/features/links/hooks";
import type { User } from "@supabase/supabase-js";
import type { Link } from "@/features/links/types";
import {
  detectMultipleContentTypes,
  type DetectedContent,
} from "@/lib/content-detector";
import { toast } from "sonner";

export interface BatchHandlers {
  onBatchDelete: (ids: string[]) => Promise<void>;
  onBatchRestore: (ids: string[]) => Promise<void>;
  onBatchPermanentDelete: (ids: string[]) => Promise<void>;
  onBatchPin: (ids: string[]) => void;
  onBatchUnpin: (ids: string[]) => void;
}

/**
 * Initial data structure for server-side prefetched links
 */
interface InitialLinksData {
  links: Link[];
  total: number;
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
  /** Server-side prefetched links for instant render */
  initialLinks?: InitialLinksData;
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
  initialLinks,
}: DashboardContentProps) {

  const filters = React.useMemo(() => {
    if (selectedCategoryId === "trash") return { is_deleted: true };
    return { is_archived: false };
  }, [selectedCategoryId]);

  // Prefetch the opposite view's data in background after initial load
  // This makes view switching instant (shortcut or dock)
  const currentView = selectedCategoryId === "trash" ? "trash" : "all";
  usePrefetchView(currentView, user.id, !!user);

  // Debounce the search query to avoid too many API requests
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState(searchQuery);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
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
    isLoadingMore,
    hasMore,
    loadMore,
  } = useLinks(!!user, filters, user.id, debouncedSearchQuery, initialLinks);

  // Sort links based on current sort settings
  const sortedLinks = React.useMemo(() => {
    const pinned = filteredLinks.filter((link) => link.is_pinned);
    const unpinned = filteredLinks.filter((link) => !link.is_pinned);

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
  }, [filteredLinks, sortBy, sortOrder]);

  const handleInlineAddSubmit = React.useCallback(() => {
    if (!addInputValue.trim() || isLoading) return;

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

      handleSubmit(validItems);
      onAddSubmit();
    }
  }, [addInputValue, isLoading, handleSubmit, onAddSubmit]);

  // Create stable batch handlers that accept IDs as parameters
  // These are passed to onSelectionChange and stored in DashboardClient
  const batchHandlers: BatchHandlers = React.useMemo(() => ({
    onBatchDelete: handleBatchDeleteLinks,
    onBatchRestore: handleBatchRestoreLinks,
    onBatchPermanentDelete: handleBatchPermanentDeleteLinks,
    onBatchPin: handleBatchPinLinks,
    onBatchUnpin: handleBatchUnpinLinks,
  }), [handleBatchDeleteLinks, handleBatchRestoreLinks, handleBatchPermanentDeleteLinks, handleBatchPinLinks, handleBatchUnpinLinks]);

  // Show skeleton when fetching and no links to display
  // This handles initial load and view transitions (e.g., switching to trash)
  if (fetchingLinks) {
    return <LinkListSkeleton />;
  }

  return (
    <LinkList
      links={sortedLinks}
      onDelete={handleDeleteLink}
      onRestore={handleRestoreLink}
      onPermanentDelete={handlePermanentDeleteLink}
      onEdit={handleEditLink}
      onCopy={handleCopyUrl}
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
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      onLoadMore={loadMore}
      onSelectionChange={onSelectionChange}
    />
  );
}
