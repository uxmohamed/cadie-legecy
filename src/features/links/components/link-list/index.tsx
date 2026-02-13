"use client";

import * as React from "react";
import type { Link } from "@/features/links/types";
import { toast } from "sonner";
import { Menu, MenuPopup, MenuTrigger } from "@/components/ui/menu";

import { useSelection } from "./use-selection";
import { useKeyboardNavigation } from "./use-keyboard-navigation";
import { LinkListEmpty } from "./link-list-empty";
import { LinkListItem } from "./link-list-item";
import { LinkContextMenu } from "./link-context-menu";
import { SelectionToolbar } from "./selection-toolbar";
import { LinkDetailSheet } from "./link-detail-sheet";
import type { LinkListProps, ContextMenuState } from "./types";

export function LinkList({
  links,
  onDelete,
  onArchive,
  onEdit,
  onCopyUrl,
  onPin,
  onUnpin,
  onBatchArchive,
  onBatchDelete,
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

  // Helper to get flattened list of links for index calculation
  const displayLinks = React.useMemo(() => {
    const pinned = links.filter((l) => l.is_pinned);
    const unpinned = links.filter((l) => !l.is_pinned);
    return [...pinned, ...unpinned];
  }, [links]);

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

  // Batch Actions
  const handleBatchArchive = React.useCallback(() => {
    if (onBatchArchive) {
      onBatchArchive(Array.from(selectedIds));
    } else {
      selectedIds.forEach((id) => onArchive?.(id));
    }
    clearSelection();
  }, [selectedIds, onArchive, onBatchArchive, clearSelection]);

  const handleBatchDelete = React.useCallback(() => {
    if (onBatchDelete) {
      onBatchDelete(Array.from(selectedIds));
    } else {
      selectedIds.forEach((id) => onDelete?.(id));
    }
    clearSelection();
  }, [selectedIds, onDelete, onBatchDelete, clearSelection]);

  const handleBatchPin = () => {
    selectedIds.forEach((id) => onPin?.(id));
  };

  const handleBatchUnpin = () => {
    selectedIds.forEach((id) => onUnpin?.(id));
  };

  // Keyboard navigation
  useKeyboardNavigation({
    displayLinks,
    linkRefs,
    focusedIndex,
    setFocusedIndex,
    selectedIds,
    clearSelection,
    selectAll,
    onBatchArchive: handleBatchArchive,
    onBatchDelete: handleBatchDelete,
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

  const pinnedLinks = links.filter((link) => link.is_pinned);
  const unpinnedLinks = links.filter((link) => !link.is_pinned);

  return (
    <div className="w-full" ref={containerRef}>
      <div className="sticky top-[104px] z-10 grid grid-cols-[1fr_auto_auto] gap-4 bg-[var(--bg)] py-4 text-xs font-medium text-[var(--fg-subtle)] relative select-none">
        <div>Title</div>
        <div>Created at</div>
        <div className="w-10"></div>
        <div className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-b from-[var(--bg)] to-transparent pointer-events-none" />
      </div>
      <div className="space-y-0.5 py-4 relative">
        {pinnedLinks.length > 0 && (
          <>
            <div className="mb-4 mt-4 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider select-none">
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
                onPin={onPin}
                onUnpin={onUnpin}
                onArchive={onArchive}
                onDelete={onDelete}
                isDragging={isDragging}
              />
            ))}
          </>
        )}
        {unpinnedLinks.length > 0 && (
          <>
            {pinnedLinks.length > 0 && (
              <div className="mb-4 mt-8 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider select-none">
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
                  onPin={onPin}
                  onUnpin={onUnpin}
                  onArchive={onArchive}
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
              onCopyUrl={onCopyUrl}
              onEdit={onEdit}
              onPin={onPin}
              onUnpin={onUnpin}
              onArchive={onArchive}
              onDelete={onDelete}
            />
          </MenuPopup>
        </Menu>
      )}

      <SelectionToolbar
        selectedCount={selectedIds.size}
        onClearSelection={clearSelection}
        onBatchArchive={handleBatchArchive}
        onBatchDelete={handleBatchDelete}
        onBatchPin={handleBatchPin}
        onBatchUnpin={handleBatchUnpin}
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
        onEdit={onEdit}
        onCopyUrl={onCopyUrl}
        onPin={onPin}
        onUnpin={onUnpin}
        onArchive={onArchive}
        onDelete={onDelete}
      />
    </div>
  );
}

// Re-export types
export type { LinkListProps } from "./types";
