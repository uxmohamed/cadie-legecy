"use client";

import * as React from "react";
import type { Link } from "@/features/links/types";
import { toast } from "sonner";

import { useSelection } from "./use-selection";
import { useKeyboardNavigation } from "./use-keyboard-navigation";
import { LinkListEmpty } from "./link-list-empty";
import { LinkListItem } from "./link-list-item";
import { LinkContextMenu } from "./link-context-menu";
import { SelectionToolbar } from "./selection-toolbar";
import { LinkDetailSheet } from "./link-detail-sheet";
import type { LinkListProps, ContextMenuState } from "./types";
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

export function LinkList({
  links,
  onDelete,
  onRestore,
  onPermanentDelete,
  onEdit,
  onCopyUrl,
  onPin,
  onUnpin,
  onBatchDelete,
  onBatchRestore,
  onBatchPermanentDelete,
  onBatchPin,
  onBatchUnpin,
  isTrashView,
}: LinkListProps) {
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(
    null
  );
  const [selectedLink, setSelectedLink] = React.useState<Link | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const linkRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const previousLengthRef = React.useRef(links.length);

  // Links are already sorted by Dashboard, just separate pinned/unpinned
  const displayLinks = React.useMemo(() => {
    if (isTrashView) return links;
    const pinned = links.filter((l) => l.is_pinned);
    const unpinned = links.filter((l) => !l.is_pinned);
    return [...pinned, ...unpinned];
  }, [links, isTrashView]);

  const {
    selectedIds,
    isDragging,
    clearSelection,
    selectAll,
    handleItemMouseDown,
    handleItemMouseEnter,
    handleRowClick,
  } = useSelection({ displayLinks });

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
  }>({ isOpen: false, type: "single" });

  const confirmPermanentDelete = React.useCallback((id: string) => {
    setDeleteConfirmation({ isOpen: true, type: "single", itemId: id });
  }, []);

  const confirmBatchPermanentDelete = React.useCallback(() => {
    setDeleteConfirmation({ isOpen: true, type: "batch" });
  }, []);

  const executeDelete = async () => {
    if (deleteConfirmation.type === "single" && deleteConfirmation.itemId) {
      onPermanentDelete?.(deleteConfirmation.itemId);
    } else if (deleteConfirmation.type === "batch") {
      if (onBatchPermanentDelete) {
        await onBatchPermanentDelete(Array.from(selectedIds));
      } else {
        await Promise.all(
          Array.from(selectedIds).map((id) => onPermanentDelete?.(id))
        );
      }
      clearSelection();
    }
    setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }));
  };

  // Batch Actions

  const handleBatchDelete = React.useCallback(async () => {
    if (onBatchDelete) {
      await onBatchDelete(Array.from(selectedIds));
    } else {
      await Promise.all(Array.from(selectedIds).map((id) => onDelete?.(id)));
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
    setDeleteConfirmation({ isOpen: true, type: "batch" });
  }, []);

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

  // Keyboard navigation
  useKeyboardNavigation({
    displayLinks,
    linkRefs,
    focusedIndex,
    setFocusedIndex,
    selectedIds,
    clearSelection,
    selectAll,

    onBatchDelete: handleBatchDelete,
    onEdit,
    onDelete,

  });

  const copyToClipboard = async (text: string, type: "url" | "color") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(
        type === "color"
          ? "Color copied to clipboard"
          : "URL copied to clipboard"
      );
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error(
        type === "color" ? "Failed to copy color" : "Failed to copy URL"
      );
    }
  };

  const handleContextMenu = (e: React.MouseEvent, link: Link) => {
    e.preventDefault();
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

  if (links.length === 0) {
    return <LinkListEmpty />;
  }

  const pinnedLinks = isTrashView ? [] : displayLinks.filter((link) => link.is_pinned);
  const unpinnedLinks = isTrashView ? displayLinks : displayLinks.filter((link) => !link.is_pinned);


  return (
    <div className="w-full" ref={containerRef}>
        <div className="space-y-px py-4 relative">
          {pinnedLinks.length > 0 && (
            <>
              <div className="mb-4 mt-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider select-none">
                Pinned
              </div>
              {pinnedLinks.map((link, index) => (
                <LinkListItem
                  key={link.id}
                  link={link}
                  index={index}
                  isPinned={true}
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
                  onCopyUrl={onCopyUrl}
                  onEdit={onEdit}
                  onPin={!isTrashView ? onPin : undefined}
                  onUnpin={!isTrashView ? onUnpin : undefined}
                  onDelete={onDelete}
                  isDragging={isDragging}
                />
              ))}
            </>
          )}

          {unpinnedLinks.length > 0 && (
            <>
              {pinnedLinks.length > 0 && (
                <div className="mb-4 mt-8 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider select-none">
                  All Links
                </div>
              )}
              {unpinnedLinks.map((link, index) => {
                const actualIndex = pinnedLinks.length + index;
                return (
                  <LinkListItem
                    key={link.id}
                    link={link}
                    index={actualIndex}
                    isPinned={false}
                    isSelected={selectedIds.has(link.id)}
                    isFocused={focusedIndex === actualIndex}
                    linkRef={(el) => {
                      linkRefs.current[actualIndex] = el;
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
                    onCopyUrl={onCopyUrl}
                    onEdit={onEdit}
                    onPin={!isTrashView ? onPin : undefined}
                    onUnpin={!isTrashView ? onUnpin : undefined}
                    onDelete={onDelete}
                    isDragging={isDragging}
                  />
                );
              })}
            </>
          )}
        </div>

      {contextMenu && (
        <Menu
          open={true}
          onOpenChange={(open: boolean) => !open && setContextMenu(null)}
        >
          <MenuTrigger
            className="fixed w-0 h-0 p-0 m-0 opacity-0 overflow-hidden pointer-events-none"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            aria-hidden="true"
            tabIndex={-1}
          >
            <span className="sr-only">Open context menu</span>
          </MenuTrigger>
          <MenuPopup align="start">
            <LinkContextMenu
              link={contextMenu.link}
              selectedCount={selectedIds.size}
              selectedIds={selectedIds}
              links={displayLinks}
              isTrashView={isTrashView}
              onCopyUrl={onCopyUrl}
              onEdit={!isTrashView ? onEdit : undefined}
              onPin={!isTrashView ? onPin : undefined}
              onUnpin={!isTrashView ? onUnpin : undefined}
              onDelete={!isTrashView ? onDelete : undefined}
              onRestore={isTrashView ? onRestore : undefined}
              onPermanentDelete={isTrashView ? confirmPermanentDelete : undefined}
              onBatchPin={!isTrashView ? handleBatchPin : undefined}
              onBatchUnpin={!isTrashView ? handleBatchUnpin : undefined}
              onBatchDelete={!isTrashView ? handleBatchDelete : undefined}
              onBatchRestore={isTrashView ? handleBatchRestore : undefined}
              onBatchPermanentDelete={isTrashView ? handleBatchPermanentDelete : undefined}
            />
          </MenuPopup>
        </Menu>
      )}

      <SelectionToolbar
        selectedCount={selectedIds.size}
        onClearSelection={clearSelection}
        onBatchDelete={handleBatchDelete}
        onBatchRestore={isTrashView ? handleBatchRestore : undefined}
        onBatchPermanentDelete={isTrashView ? handleBatchPermanentDelete : undefined}
        onBatchPin={!isTrashView ? handleBatchPin : undefined}
        onBatchUnpin={!isTrashView ? handleBatchUnpin : undefined}
        selectedLinks={displayLinks.filter(link => selectedIds.has(link.id))}
        isTrashView={isTrashView}
      />

      <LinkDetailSheet
        link={selectedLink}
        links={displayLinks}
        currentIndex={
          selectedLink
            ? displayLinks.findIndex((l) => l.id === selectedLink.id)
            : -1
        }
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSelectedLink(null);
          }
        }}
        onLinkChange={(link) => {
          setSelectedLink(link);
        }}
        onEdit={!isTrashView ? onEdit : undefined}
        onCopyUrl={onCopyUrl}
        onPin={!isTrashView ? onPin : undefined}
        onUnpin={!isTrashView ? onUnpin : undefined}
        onDelete={!isTrashView ? onDelete : undefined}
        onRestore={isTrashView ? onRestore : undefined}
        onPermanentDelete={isTrashView ? confirmPermanentDelete : undefined}
        isTrashView={isTrashView}
      />

      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {deleteConfirmation.type === 'batch' ? `${selectedIds.size} items` : 'this item'}? This action cannot be undone.
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
    </div>
  );
}

// Re-export types
export type { LinkListProps } from "./types";
