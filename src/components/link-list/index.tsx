"use client";

import * as React from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { Link } from "@/features/links/types";
import type { Space } from "@/types";
import { toast } from "sonner";
import { detectContentType } from "@/lib/content-detector";
import { canonicalizeColor } from "@/lib/canonicalize";

import { useSelection } from "./use-selection";
import { useKeyboardNavigation } from "./use-keyboard-navigation";
import { LinkListEmpty } from "./link-list-empty";
import { LinkListItem } from "./link-list-item";
import { InlineAddItem } from "./inline-add-item";
import { LinkContextMenu } from "./link-context-menu";
import { LinkDetailDialog } from "./link-detail-dialog";
import { LinkItemSkeleton } from "@/components/skeletons";
import type { ContextMenuState } from "./types";
import { Menu, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface LinkListProps {
  links: Link[];
  onDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onPermanentDelete: (id: string) => Promise<void>;
  onPin: (id: string) => Promise<void>;
  onUnpin: (id: string) => Promise<void>;
  onCopy: (url: string, isColor?: boolean) => Promise<void>;
  onEdit: (link: Link) => void;
  onUpdate: (id: string, data: Partial<Link>) => Promise<void>;
  onBatchDelete: (ids: string[]) => Promise<void>;
  onBatchRestore: (ids: string[]) => Promise<void>;
  onBatchPermanentDelete: (ids: string[]) => Promise<void>;
  onBatchPin: (ids: string[]) => Promise<void>;
  onBatchUnpin: (ids: string[]) => Promise<void>;
  isTrashView?: boolean;
  isAddingItem?: boolean;
  addInputValue?: string;
  onAddInputChange?: (value: string) => void;
  onAddSubmit?: () => void;
  onAddCancel: () => void;
  // Inline edit mode props
  editingLinkId?: string | null;
  editMode?: "title" | "url" | null;
  editValue?: string;
  onRename?: (id: string, newTitle: string) => Promise<void>;
  onEditChange?: (value: string) => void;
  onEditSubmit?: () => Promise<void>;
  onEditCancel?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onSelectionChange?: (
    selectedCount: number,
    selectedLinks: Link[],
    clearSelection: () => void,
    batchHandlers: {
      onBatchDelete: (ids: string[]) => Promise<void>;
      onBatchRestore: (ids: string[]) => Promise<void>;
      onBatchPermanentDelete: (ids: string[]) => Promise<void>;
      onBatchPin: (ids: string[]) => Promise<void>;
      onBatchUnpin: (ids: string[]) => Promise<void>;
    }
  ) => void;
  spaces?: Space[];
  linkSpacesMap?: Map<string, string[]>; // Map of link ID to space IDs
  onAddToSpace?: (linkId: string, spaceId: string) => Promise<void>;
  onRemoveFromSpace?: (linkId: string, spaceId: string) => Promise<void>;
}

export function LinkList({
  links,
  onDelete,
  onRestore,
  onPermanentDelete,
  onPin,
  onUnpin,
  onCopy,
  onEdit,
  onUpdate,
  onBatchDelete,
  onBatchRestore,
  onBatchPermanentDelete,
  onBatchPin,
  onBatchUnpin,
  isTrashView = false,
  isAddingItem = false,
  addInputValue = "",
  onAddInputChange,
  onAddSubmit,
  onAddCancel,
  editingLinkId,
  editMode,
  editValue,
  onRename,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  onSelectionChange,
  spaces = [],
  linkSpacesMap = new Map(),
  onAddToSpace,
  onRemoveFromSpace,
}: LinkListProps) {
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(
    null
  );
  const [selectedLink, setSelectedLink] = React.useState<Link | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Internal edit state (used if not provided externally)
  const [internalEditingLinkId, setInternalEditingLinkId] = React.useState<
    string | null
  >(null);
  const [internalEditMode, setInternalEditMode] = React.useState<
    "title" | "url" | null
  >(null);
  const [internalEditValue, setInternalEditValue] = React.useState("");

  // Color change confirmation dialog state
  const [colorChangeDialog, setColorChangeDialog] = React.useState<{
    isOpen: boolean;
    linkId: string | null;
    newTitle: string;
    newColorValue: string;
    currentColorValue: string;
  }>({
    isOpen: false,
    linkId: null,
    newTitle: "",
    newColorValue: "",
    currentColorValue: "",
  });

  // Use external props if provided, otherwise use internal state
  const effectiveEditingLinkId = editingLinkId ?? internalEditingLinkId;
  const effectiveEditMode = editMode ?? internalEditMode;
  const effectiveEditValue = editValue ?? internalEditValue;

  const linkRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [offset, setOffset] = React.useState(0);

  React.useLayoutEffect(() => {
    if (containerRef.current) {
      setOffset(containerRef.current.offsetTop);
    }
  }, []);

  const previousLengthRef = React.useRef(links.length);

  // Links are already sorted by Dashboard, just separate pinned/unpinned
  // Deduplicate by ID to prevent duplicate keys
  const displayLinks = React.useMemo(() => {
    // Deduplicate links by ID (keep first occurrence)
    const seenIds = new Set<string>();
    const uniqueLinks = links.filter((link) => {
      if (seenIds.has(link.id)) {
        return false;
      }
      seenIds.add(link.id);
      return true;
    });

    if (isTrashView) return uniqueLinks;
    const pinned: typeof uniqueLinks = [];
    const unpinned: typeof uniqueLinks = [];
    for (const link of uniqueLinks) {
      (link.is_pinned ? pinned : unpinned).push(link);
    }
    return [...pinned, ...unpinned];
  }, [links, isTrashView]);

  const {
    selectedIds,
    setSelectedIds,
    isDragging,
    clearSelection,
    selectAll,
    handleItemMouseDown,
    handleItemMouseEnter,
    handleRowClick,
    lastSelectedIndex,
    setLastSelectedIndex,
  } = useSelection({ displayLinks });

  // Notify parent of selection changes (refs declared here, effect after batch handlers)
  const onSelectionChangeRef = React.useRef(onSelectionChange);
  const clearSelectionRef = React.useRef(clearSelection);
  React.useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
    clearSelectionRef.current = clearSelection;
  }, [onSelectionChange, clearSelection]);

  // Update refs and focused index when links change
  React.useEffect(() => {
    linkRefs.current = linkRefs.current.slice(0, displayLinks.length);

    if (
      displayLinks.length < previousLengthRef.current &&
      focusedIndex !== null
    ) {
      const newFocusIndex = Math.min(focusedIndex, displayLinks.length - 1);
      setFocusedIndex(newFocusIndex);
    }

    previousLengthRef.current = displayLinks.length;
  }, [displayLinks.length, focusedIndex]);

  // Delete Dialog State
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    isOpen: boolean;
    type: "single" | "batch";
    itemId?: string;
    batchIds?: string[];
  }>({ isOpen: false, type: "single" });

  const confirmPermanentDelete = React.useCallback((id: string) => {
    setDeleteConfirmation({ isOpen: true, type: "single", itemId: id });
  }, []);

  const confirmBatchPermanentDelete = React.useCallback(() => {
    const idsToDelete = Array.from(selectedIds);
    setDeleteConfirmation({
      isOpen: true,
      type: "batch",
      batchIds: idsToDelete,
    });
  }, [selectedIds]);

  const executeDelete = async () => {
    if (deleteConfirmation.type === "single" && deleteConfirmation.itemId) {
      onPermanentDelete?.(deleteConfirmation.itemId);
    } else if (
      deleteConfirmation.type === "batch" &&
      deleteConfirmation.batchIds
    ) {
      if (onBatchPermanentDelete) {
        await onBatchPermanentDelete(deleteConfirmation.batchIds);
      } else {
        await Promise.all(
          deleteConfirmation.batchIds.map((id) => onPermanentDelete?.(id))
        );
      }
      clearSelection();
    }
    setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }));
  };

  // Batch Actions - used by context menu and keyboard shortcuts
  const handleBatchDelete = React.useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (onBatchDelete) {
      await onBatchDelete(ids);
    } else {
      await Promise.all(ids.map((id) => onDelete?.(id)));
    }
    clearSelection();
  }, [selectedIds, onDelete, onBatchDelete, clearSelection]);

  const handleBatchRestore = React.useCallback(async () => {
    if (onBatchRestore) {
      await onBatchRestore(Array.from(selectedIds));
    } else {
      await Promise.all(Array.from(selectedIds).map((id) => onRestore?.(id)));
    }
    clearSelection();
  }, [selectedIds, onRestore, onBatchRestore, clearSelection]);

  const handleBatchPermanentDelete = React.useCallback(() => {
    const idsToDelete = Array.from(selectedIds);
    setDeleteConfirmation({
      isOpen: true,
      type: "batch",
      batchIds: idsToDelete,
    });
  }, [selectedIds]);

  const handleBatchPin = React.useCallback(() => {
    if (isTrashView) return;
    if (onBatchPin) {
      onBatchPin(Array.from(selectedIds));
    } else {
      selectedIds.forEach((id) => onPin?.(id));
    }
    clearSelection();
  }, [selectedIds, onPin, onBatchPin, clearSelection, isTrashView]);

  const handleBatchUnpin = React.useCallback(() => {
    if (isTrashView) return;
    if (onBatchUnpin) {
      onBatchUnpin(Array.from(selectedIds));
    } else {
      selectedIds.forEach((id) => onUnpin?.(id));
    }
    clearSelection();
  }, [selectedIds, onUnpin, onBatchUnpin, clearSelection, isTrashView]);

  // Selection change callback with batch handlers
  // We pass the prop handlers directly - they accept IDs as parameters
  // This avoids closure issues since the parent will call these with the current selectedLinks IDs
  const prevSelectedIdsStrRef = React.useRef<string>("");
  React.useEffect(() => {
    const selectedIdsArray = Array.from(selectedIds).sort();
    const selectedIdsStr = selectedIdsArray.join(",");

    if (
      selectedIdsStr !== prevSelectedIdsStrRef.current &&
      onSelectionChangeRef.current
    ) {
      prevSelectedIdsStrRef.current = selectedIdsStr;
      const selectedLinksArray = displayLinks.filter((link) =>
        selectedIds.has(link.id)
      );
      // Pass the prop handlers directly - they accept IDs as parameters
      onSelectionChangeRef.current(
        selectedIds.size,
        selectedLinksArray,
        clearSelectionRef.current,
        {
          onBatchDelete: onBatchDelete,
          onBatchRestore: onBatchRestore,
          onBatchPermanentDelete: onBatchPermanentDelete,
          onBatchPin: onBatchPin,
          onBatchUnpin: onBatchUnpin,
        }
      );
    }
  }, [
    selectedIds,
    displayLinks,
    onBatchDelete,
    onBatchRestore,
    onBatchPermanentDelete,
    onBatchPin,
    onBatchUnpin,
  ]);

  // Inline edit handlers
  const handleRename = React.useCallback(
    (link: Link) => {
      if (onRename) {
        onRename(link.id, link.title || link.url);
      } else {
        setInternalEditingLinkId(link.id);
        setInternalEditMode("title");
        setInternalEditValue(link.title || link.url);
      }
    },
    [onRename]
  );

  const handleEditChange = React.useCallback(
    (value: string) => {
      if (onEditChange) {
        onEditChange(value);
      } else {
        setInternalEditValue(value);
      }
    },
    [onEditChange]
  );

  const handleEditSubmit = React.useCallback(() => {
    if (onEditSubmit) {
      onEditSubmit();
      return;
    }

    // Find the link being edited
    const link = links.find((l) => l.id === effectiveEditingLinkId);
    if (link && effectiveEditValue.trim() && onUpdate) {
      // Only update if the value actually changed
      if (effectiveEditMode === "title") {
        const currentTitle = link.title || link.url;
        const newTitle = effectiveEditValue.trim();

        if (newTitle !== currentTitle) {
          // Check if this is a color item
          if (link.content_type === "color") {
            // Check if the new title is a color
            const detected = detectContentType(newTitle);
            if (detected && detected.type === "color") {
              // Get the new color's hex value
              const newColorHex = canonicalizeColor(detected.value);
              const currentColorHex = canonicalizeColor(
                link.color_value || link.title
              );

              // If the color would actually change, show confirmation dialog
              if (newColorHex !== currentColorHex) {
                setColorChangeDialog({
                  isOpen: true,
                  linkId: link.id,
                  newTitle: newTitle,
                  newColorValue: newColorHex,
                  currentColorValue: currentColorHex,
                });
                // Don't clear edit state yet - keep showing until user decides
                return;
              }
            }
            // Not a color name or same color - just update title (keep color_value)
          }

          // Regular rename (non-color or color with non-color new name)
          onUpdate(link.id, { title: newTitle });
          toast.success("Link updated");
        }
      }
    }
    // Clear edit state and focus immediately
    setInternalEditingLinkId(null);
    setInternalEditMode(null);
    setInternalEditValue("");
    setFocusedIndex(null);
  }, [
    onEditSubmit,
    effectiveEditingLinkId,
    effectiveEditMode,
    effectiveEditValue,
    links,
    onUpdate,
  ]);

  // Handle color change confirmation
  const handleColorChangeConfirm = React.useCallback(() => {
    if (colorChangeDialog.linkId && onUpdate) {
      // Update both title and color_value
      onUpdate(colorChangeDialog.linkId, {
        title: colorChangeDialog.newTitle,
        color_value: colorChangeDialog.newColorValue,
      });
      toast.success("Color updated");
    }
    // Clear dialog and edit state
    setColorChangeDialog({
      isOpen: false,
      linkId: null,
      newTitle: "",
      newColorValue: "",
      currentColorValue: "",
    });
    setInternalEditingLinkId(null);
    setInternalEditMode(null);
    setInternalEditValue("");
    setFocusedIndex(null);
  }, [colorChangeDialog, onUpdate]);

  const handleColorChangeCancel = React.useCallback(() => {
    // Close dialog but keep edit state so user can continue editing
    setColorChangeDialog({
      isOpen: false,
      linkId: null,
      newTitle: "",
      newColorValue: "",
      currentColorValue: "",
    });
    // Also clear edit mode to exit gracefully
    setInternalEditingLinkId(null);
    setInternalEditMode(null);
    setInternalEditValue("");
    setFocusedIndex(null);
  }, []);

  const handleEditCancel = React.useCallback(() => {
    if (onEditCancel) {
      onEditCancel();
    } else {
      setInternalEditingLinkId(null);
      setInternalEditMode(null);
      setInternalEditValue("");
    }
  }, [onEditCancel]);

  // Keyboard navigation
  useKeyboardNavigation({
    displayLinks,
    linkRefs,
    focusedIndex,
    setFocusedIndex,
    selectedIds,
    setSelectedIds,
    clearSelection,
    selectAll,
    onBatchDelete: handleBatchDelete,
    onBatchPermanentDelete: isTrashView
      ? handleBatchPermanentDelete
      : undefined,
    onEdit: (link) => onEdit(link),
    onDelete,
    isTrashView,
    lastSelectedIndex,
    setLastSelectedIndex,
    disabled: sheetOpen,
  });

  const handleContextMenu = (e: React.MouseEvent, link: Link) => {
    e.preventDefault();
    // If the right-clicked item is not in the current selection, select only that item
    // If it's already selected, keep the current selection (for batch actions)
    if (!selectedIds.has(link.id)) {
      const newSet = new Set<string>();
      newSet.add(link.id);
      setSelectedIds(newSet);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, link });
  };

  const handleItemClick = (
    e: React.MouseEvent<HTMLDivElement>,
    link: Link,
    index: number
  ) => {
    handleRowClick(e, link, index, () => {
      // Open sheet with link details
      setSelectedLink(link);
      setSheetOpen(true);
    });
  };

  // Compute these values before the virtualizer hook (hooks must be called unconditionally)
  const pinnedLinks = isTrashView
    ? []
    : displayLinks.filter((link) => link.is_pinned);
  const unpinnedLinks = isTrashView
    ? displayLinks
    : displayLinks.filter((link) => !link.is_pinned);
  const showEmptyState = links.length === 0 && !isAddingItem;

  // Build flat list of virtual items for virtualization
  type VirtualItem =
    | { type: "pinned-header" }
    | { type: "all-links-header" }
    | { type: "link"; link: Link; index: number; isPinned: boolean }
    | { type: "loading-more" };

  const virtualItems: VirtualItem[] = [];

  // Only build virtual items if not showing empty state
  if (!showEmptyState) {
    // Pinned header
    if (pinnedLinks.length > 0) {
      virtualItems.push({ type: "pinned-header" });
    }

    // Pinned links
    pinnedLinks.forEach((link, index) => {
      virtualItems.push({ type: "link", link, index, isPinned: true });
    });

    // Note: add-input is rendered separately as a fixed element, not in the virtualized list

    // All Links header (only if there are pinned items)
    if (unpinnedLinks.length > 0 && pinnedLinks.length > 0) {
      virtualItems.push({ type: "all-links-header" });
    }

    // Unpinned links
    unpinnedLinks.forEach((link, index) => {
      virtualItems.push({
        type: "link",
        link,
        index: pinnedLinks.length + index,
        isPinned: false,
      });
    });

    // Loading more skeleton
    if (isLoadingMore) {
      virtualItems.push({ type: "loading-more" });
    }
  }

  // Estimate heights for different row types
  const getItemSize = (index: number) => {
    const item = virtualItems[index];
    if (!item) return 56; // fallback
    if (item.type === "pinned-header") return 40; // header with margin
    if (item.type === "all-links-header") return 56; // header with more margin
    if (item.type === "loading-more") return 64 * 3; // 3 skeleton items
    return 64; // link item height
  };

  // Track mount state to prevent flushSync during initial render
  // This fixes the React 18 "flushSync during render" warning from TanStack Virtual
  // Reference: https://github.com/TanStack/virtual/issues/628
  const isMountedRef = React.useRef(false);
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Custom observeElementOffset that guards the callback with isMounted check
  // This prevents flushSync from being called during React's render phase
  const observeElementOffset = React.useCallback(
    (
      _instance: unknown,
      cb: (offset: number, isScrolling: boolean) => void
    ) => {
      const handleScroll = () => {
        // Only call the callback if the component is mounted
        // This prevents the flushSync warning during initial render
        if (isMountedRef.current) {
          cb(window.scrollY, false);
        }
      };

      // Initial call (deferred to avoid flushSync during render)
      queueMicrotask(() => {
        if (isMountedRef.current) {
          cb(window.scrollY, false);
        }
      });

      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleScroll, { passive: true });

      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      };
    },
    []
  );

  // Window virtualizer - uses native window scroll
  // This hook MUST be called unconditionally (React rules of hooks)
  const virtualizer = useWindowVirtualizer({
    count: virtualItems.length,
    estimateSize: getItemSize,
    overscan: 10, // Render 10 extra items above/below viewport for smoother scrolling
    observeElementOffset, // Custom offset observer to fix flushSync warning
  });

  // Wrap measureElement to avoid flushSync during render
  // This defers the measurement to avoid React's "flushSync during render" warning
  const measureElement = React.useCallback(
    (node: HTMLElement | null) => {
      if (node) {
        // Defer measurement to next microtask to avoid flushSync during render
        queueMicrotask(() => {
          if (isMountedRef.current) {
            virtualizer.measureElement(node);
          }
        });
      }
    },
    [virtualizer]
  );

  const virtualRows = virtualizer.getVirtualItems();

  // Infinite scroll observer
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          onLoadMore
        ) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "500px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Track if component has mounted to prevent hydration mismatch
  // On server, we always render the list container structure to match initial client render
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  // Scroll to very top when add input is triggered
  React.useEffect(() => {
    if (isAddingItem) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAddingItem]);

  return (
    <div className="w-full" ref={containerRef}>
      {/* Show empty state only when not in add mode and after mount */}
      {/* This prevents hydration mismatch by always rendering list structure initially */}
      {showEmptyState && hasMounted ? (
        <LinkListEmpty />
      ) : (
        <>
          {/* Add input - appears at top of list, pushes links down */}
          {isAddingItem && onAddInputChange && onAddSubmit && onAddCancel && (
            <InlineAddItem
              value={addInputValue}
              onChange={onAddInputChange}
              onSubmit={onAddSubmit}
              onCancel={onAddCancel}
            />
          )}

          {/* Virtualized list container */}
          {/* Explicitly check hasMounted to separate server/client rendering paths */}
          {/* Server placeholder must match LinkListSkeleton structure to avoid hydration mismatch */}
          {!hasMounted ? (
            <div className="space-y-px py-4 relative">
              {/* Render skeleton items matching the Suspense fallback structure */}
              {Array.from({ length: Math.min(8, virtualItems.length || 8) }).map((_, index) => (
                <LinkItemSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div
              className="space-y-px py-4 relative"
              style={{ height: `${virtualizer.getTotalSize()}px` }}
            >
              {virtualRows.map((virtualRow) => {
                const item = virtualItems[virtualRow.index];

                // Render pinned header
                if (item.type === "pinned-header") {
                  return (
                    <div
                      key="pinned-header"
                      data-index={virtualRow.index}
                      ref={measureElement}
                      className="absolute top-0 left-0 w-full"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <div
                        className={`mb-4 mt-4 text-xs font-semibold text-fg-muted uppercase tracking-wider select-none transition-opacity duration-200 ${
                          isAddingItem || effectiveEditingLinkId
                            ? "opacity-20"
                            : "opacity-100"
                        }`}
                      >
                        Pinned
                      </div>
                    </div>
                  );
                }

                // Render all-links header
                if (item.type === "all-links-header") {
                  return (
                    <div
                      key="all-links-header"
                      data-index={virtualRow.index}
                      ref={measureElement}
                      className="absolute top-0 left-0 w-full"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <div
                        className={`mb-4 mt-8 text-xs font-semibold text-fg-muted uppercase tracking-wider select-none transition-opacity duration-200 ${
                          isAddingItem || effectiveEditingLinkId
                            ? "opacity-20"
                            : "opacity-100"
                        }`}
                      >
                        All Links
                      </div>
                    </div>
                  );
                }

                // Render link item
                if (item.type === "link") {
                  const { link, index, isPinned } = item;
                  const isThisEditing = effectiveEditingLinkId === link.id;
                  const shouldDim =
                    (isAddingItem || effectiveEditingLinkId) && !isThisEditing;

                  return (
                    <div
                      key={link.id}
                      data-index={virtualRow.index}
                      ref={measureElement}
                      className="absolute top-0 left-0 w-full pb-0.5"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <div
                        className={`transition-opacity duration-200 ${
                          shouldDim ? "opacity-20 pointer-events-none" : "opacity-100"
                        }`}
                      >
                        <LinkListItem
                          link={link}
                          index={index}
                          isPinned={isPinned}
                          isSelected={selectedIds.has(link.id)}
                          isFocused={focusedIndex === index}
                          linkRef={(el) => {
                            linkRefs.current[index] = el;
                          }}
                          onMouseDown={handleItemMouseDown}
                          onClick={handleItemClick}
                          onMouseEnter={handleItemMouseEnter}
                          onMouseLeave={(idx) => {
                            if (focusedIndex === idx && !isDragging)
                              setFocusedIndex(null);
                          }}
                          onFocus={setFocusedIndex}
                          onContextMenu={handleContextMenu}
                          onCopy={onCopy}
                          onEdit={() => onEdit(link)}
                          onPin={!isTrashView ? onPin : undefined}
                          onUnpin={!isTrashView ? onUnpin : undefined}
                          onDelete={onDelete}
                          isDragging={isDragging}
                          isEditing={isThisEditing}
                          editMode={isThisEditing ? effectiveEditMode : null}
                          editValue={isThisEditing ? effectiveEditValue : ""}
                          onEditChange={handleEditChange}
                          onEditSubmit={handleEditSubmit}
                          onEditCancel={handleEditCancel}
                        />
                      </div>
                    </div>
                  );
                }

                // Render loading more skeleton
                if (item.type === "loading-more") {
                  return (
                    <div
                      key="loading-more"
                      data-index={virtualRow.index}
                      ref={measureElement}
                      className="absolute top-0 left-0 w-full"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <div className="space-y-px">
                        <LinkItemSkeleton />
                        <LinkItemSkeleton />
                        <LinkItemSkeleton />
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          {hasMore && !isLoadingMore && (
            <div ref={loadMoreRef} className="h-4 w-full" />
          )}
        </>
      )}

      {contextMenu && (
        <Menu
          open={true}
          onOpenChange={(open: boolean) => !open && setContextMenu(null)}
          modal={false}
        >
          <MenuTrigger
            className="fixed w-0 h-0 p-0 m-0 opacity-0 overflow-hidden pointer-events-none"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            aria-hidden="true"
            tabIndex={-1}
          >
            <span className="sr-only">Open context menu</span>
          </MenuTrigger>
          <MenuPopup align="start" className="w-52">
            <LinkContextMenu
              link={contextMenu.link}
              selectedCount={selectedIds.size}
              selectedIds={selectedIds}
              links={displayLinks}
              isTrashView={isTrashView}
              onCopy={onCopy}
              onEdit={!isTrashView ? () => onEdit(contextMenu.link) : undefined}
              onRename={!isTrashView ? handleRename : undefined}
              onPin={!isTrashView ? onPin : undefined}
              onUnpin={!isTrashView ? onUnpin : undefined}
              spaces={spaces}
              linkSpaces={linkSpacesMap.get(contextMenu.link.id) || []}
              onAddToSpace={onAddToSpace}
              onRemoveFromSpace={onRemoveFromSpace}
              onDelete={!isTrashView ? onDelete : undefined}
              onRestore={isTrashView ? onRestore : undefined}
              onPermanentDelete={
                isTrashView ? confirmPermanentDelete : undefined
              }
              onBatchPin={!isTrashView ? handleBatchPin : undefined}
              onBatchUnpin={!isTrashView ? handleBatchUnpin : undefined}
              onBatchDelete={!isTrashView ? handleBatchDelete : undefined}
              onBatchRestore={isTrashView ? handleBatchRestore : undefined}
              onBatchPermanentDelete={
                isTrashView ? handleBatchPermanentDelete : undefined
              }
            />
          </MenuPopup>
        </Menu>
      )}

      <LinkDetailDialog
        link={selectedLink}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSelectedLink(null);
          }
        }}
        onCopy={onCopy}
        onPin={!isTrashView ? onPin : undefined}
        onUnpin={!isTrashView ? onUnpin : undefined}
        onDelete={!isTrashView ? onDelete : undefined}
        onRename={!isTrashView ? handleRename : undefined}
        spaces={spaces}
        linkSpaces={selectedLink ? linkSpacesMap.get(selectedLink.id) || [] : []}
        onAddToSpace={onAddToSpace}
        onRemoveFromSpace={onRemoveFromSpace}
        // Navigation Props
        onNext={() => {
           const idx = displayLinks.findIndex(l => l.id === selectedLink?.id);
           if (idx !== -1 && idx < displayLinks.length - 1) {
             setSelectedLink(displayLinks[idx + 1]);
           }
        }}
        onPrev={() => {
           const idx = displayLinks.findIndex(l => l.id === selectedLink?.id);
           if (idx > 0) {
             setSelectedLink(displayLinks[idx - 1]);
           }
        }}
        hasNext={(() => {
           const idx = displayLinks.findIndex(l => l.id === selectedLink?.id);
           return idx !== -1 && idx < displayLinks.length - 1;
        })()}
        hasPrev={(() => {
           const idx = displayLinks.findIndex(l => l.id === selectedLink?.id);
           return idx > 0;
        })()}
      />

      <AlertDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              {deleteConfirmation.type === "batch"
                ? `${deleteConfirmation.batchIds?.length || 0} items`
                : "this item"}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </AlertDialogClose>
            <Button variant="destructive" onClick={executeDelete}>
              Delete permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Color Change Confirmation Dialog */}
      <AlertDialog
        open={colorChangeDialog.isOpen}
        onOpenChange={(open) => !open && handleColorChangeCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change color?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>This will change the actual color, not just the label.</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 w-5 flex-shrink-0 rounded-full border border-border-muted"
                      style={{
                        backgroundColor: colorChangeDialog.currentColorValue,
                      }}
                    />
                    <span className="text-sm font-[470] text-fg">
                      Current
                    </span>
                  </div>
                  <span className="text-fg-subtle">→</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 w-5 flex-shrink-0 rounded-full border border-border-muted"
                      style={{
                        backgroundColor: colorChangeDialog.newColorValue,
                      }}
                    />
                    <span className="text-sm font-[470] text-fg">
                      {colorChangeDialog.newTitle}
                    </span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </AlertDialogClose>
            <Button onClick={handleColorChangeConfirm}>Change Color</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Re-export types
export type { LinkListProps } from "./types";
