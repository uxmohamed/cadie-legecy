"use client";

import * as React from "react";
import type { Link } from "@/features/links/types";
import { toast } from "sonner";
import { Menu, MenuPopup, MenuTrigger, MenuItem } from "@/components/ui/menu";
import { ChevronDown } from "lucide-react";

import { useSelection } from "./use-selection";
import { useKeyboardNavigation } from "./use-keyboard-navigation";
import { LinkListEmpty } from "./link-list-empty";
import { LinkListItem } from "./link-list-item";
import { LinkContextMenu } from "./link-context-menu";
import { SelectionToolbar } from "./selection-toolbar";
import { LinkDetailSheet } from "./link-detail-sheet";
import type { LinkListProps, ContextMenuState } from "./types";

type SortOption = "date-desc" | "date-asc" | "alpha-asc" | "alpha-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date-desc", label: "Date ↓ (Newest first)" },
  { value: "date-asc", label: "Date ↑ (Oldest first)" },
  { value: "alpha-asc", label: "A → Z" },
  { value: "alpha-desc", label: "Z → A" },
];

export function LinkList({
  links,
  onDelete,

  onEdit,
  onCopyUrl,
  onPin,
  onUnpin,

  onBatchDelete,
  isTrashView,
}: LinkListProps) {
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(
    null
  );
  const [selectedLink, setSelectedLink] = React.useState<Link | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<SortOption>("date-desc");

  const linkRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const previousLengthRef = React.useRef(links.length);

  // Sort links based on selected option
  const sortedLinks = React.useMemo(() => {
    const sorted = [...links];
    
    switch (sortOption) {
      case "date-desc":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "date-asc":
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "alpha-asc":
        sorted.sort((a, b) => (a.title || a.url).localeCompare(b.title || b.url));
        break;
      case "alpha-desc":
        sorted.sort((a, b) => (b.title || b.url).localeCompare(a.title || a.url));
        break;
    }
    
    return sorted;
  }, [links, sortOption]);

  // Helper to get flattened list of links for index calculation
  const displayLinks = React.useMemo(() => {
    if (isTrashView) return sortedLinks;
    const pinned = sortedLinks.filter((l) => l.is_pinned);
    const unpinned = sortedLinks.filter((l) => !l.is_pinned);
    return [...pinned, ...unpinned];
  }, [sortedLinks, isTrashView]);

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


  const handleBatchDelete = React.useCallback(() => {
    if (onBatchDelete) {
      onBatchDelete(Array.from(selectedIds));
    } else {
      selectedIds.forEach((id) => onDelete?.(id));
    }
    clearSelection();
  }, [selectedIds, onDelete, onBatchDelete, clearSelection]);

  const handleBatchPin = () => {
    if (isTrashView) return;
    selectedIds.forEach((id) => onPin?.(id));
  };

  const handleBatchUnpin = () => {
    if (isTrashView) return;
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

  const currentSortLabel = SORT_OPTIONS.find(opt => opt.value === sortOption)?.label || "Sort";

  return (
    <div className="w-full" ref={containerRef}>
      <div className="sticky top-[104px] px-3 z-10 bg-[#fafafa] py-4 text-xs font-medium text-neutral-400 relative select-none">
        <div className="flex justify-between">
          <div >Title</div>
          <div className="mr-2">Created at</div>
        </div>
        <div className="flex justify-start mt-4">
          <Menu>
            <MenuTrigger className="flex items-center gap-1 hover:text-neutral-600 transition-colors cursor-pointer">
              <span>{currentSortLabel}</span>
              <ChevronDown className="w-3 h-3" />
            </MenuTrigger>
            <MenuPopup>
              {SORT_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value}
                  onSelect={() => setSortOption(option.value)}
                  className={sortOption === option.value ? "bg-neutral-100" : ""}
                >
                  {option.label}
                </MenuItem>
              ))}
            </MenuPopup>
          </Menu>
        </div>
        <div className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-b from-[#fafafa] to-transparent pointer-events-none" />
      </div>
      
      <div className="space-y-0.5 py-4 relative">
        {pinnedLinks.length > 0 && (
          <>
            <div className="mb-4 mt-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider select-none">
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
              <div className="mb-4 mt-8 text-xs font-semibold text-neutral-500 uppercase tracking-wider select-none">
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
              onCopyUrl={onCopyUrl}
              onEdit={onEdit}
              onPin={!isTrashView ? onPin : undefined}
              onUnpin={!isTrashView ? onUnpin : undefined}

              onDelete={onDelete}
            />
          </MenuPopup>
        </Menu>
      )}

      <SelectionToolbar
        selectedCount={selectedIds.size}
        onClearSelection={clearSelection}

        onBatchDelete={handleBatchDelete}
        onBatchPin={!isTrashView ? handleBatchPin : undefined}
        onBatchUnpin={!isTrashView ? handleBatchUnpin : undefined}
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
        onPin={!isTrashView ? onPin : undefined}
        onUnpin={!isTrashView ? onUnpin : undefined}

        onDelete={onDelete}
      />
    </div>
  );
}

// Re-export types
export type { LinkListProps } from "./types";
