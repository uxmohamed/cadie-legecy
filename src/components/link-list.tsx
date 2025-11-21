"use client";

import * as React from "react";
import type { Link } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Favicon } from "@/components/ui/favicon";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuShortcut,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  MoreHorizontal,
  Copy,
  Edit,
  Archive,
  Trash,
  Pin,
  PinOff,
  FileText,
  X,
} from "lucide-react";
import { extractTextFromRichText } from "@/lib/rich-text-utils";

interface LinkListProps {
  links: Link[];
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onEdit?: (link: Link) => void;
  onCopyUrl?: (url: string) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
}

export function LinkList({
  links,
  onDelete,
  onArchive,
  onEdit,
  onCopyUrl,
  onPin,
  onUnpin,
}: LinkListProps) {
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    link: Link;
  } | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStartIndex, setDragStartIndex] = React.useState<number | null>(
    null
  );
  const [dragCurrentIndex, setDragCurrentIndex] = React.useState<number | null>(
    null
  );
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<
    number | null
  >(null);

  const mouseDownPos = React.useRef<{ x: number; y: number } | null>(null);
  const wasDraggingRef = React.useRef(false);
  const shouldOpenRef = React.useRef(false);

  const linkRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const previousLengthRef = React.useRef(links.length);

  // Helper to get flattened list of links for index calculation
  const displayLinks = React.useMemo(() => {
    const pinned = links.filter((l) => l.is_pinned);
    const unpinned = links.filter((l) => !l.is_pinned);
    return [...pinned, ...unpinned];
  }, [links]);

  React.useEffect(() => {
    linkRefs.current = linkRefs.current.slice(0, displayLinks.length);

    if (
      displayLinks.length < previousLengthRef.current &&
      focusedIndex !== null
    ) {
      const newFocusIndex = Math.min(focusedIndex, displayLinks.length - 1);
      setFocusedIndex(newFocusIndex);
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const id of next) {
        if (!displayLinks.find((l) => l.id === id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    previousLengthRef.current = displayLinks.length;
  }, [displayLinks.length, focusedIndex, displayLinks]);

  // Global mouse up/move handler
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseDownPos.current) return;

      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5 && !isDragging) {
        setIsDragging(true);
        wasDraggingRef.current = true;
        shouldOpenRef.current = false; // Cancel open on drag
      }
    };

    const handleMouseUp = () => {
      mouseDownPos.current = null;
      if (isDragging) {
        setIsDragging(false);
        setDragStartIndex(null);
        setDragCurrentIndex(null);
        setTimeout(() => {
          wasDraggingRef.current = false;
        }, 0);
      } else {
        wasDraggingRef.current = false;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        selectedIds.size > 0 &&
        !target.closest(".group") &&
        !target.closest(".fixed.bottom-8") &&
        !target.closest('[role="menu"]')
      ) {
        setSelectedIds(new Set());
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isDragging, selectedIds.size]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Color copied to clipboard", "success");
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("Failed to copy color", "error");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, link: Link) => {
    e.preventDefault();
    if (!selectedIds.has(link.id)) {
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
        setSelectedIds(new Set());
      }
      setContextMenu({ x: e.clientX, y: e.clientY, link });
    } else {
      setContextMenu({ x: e.clientX, y: e.clientY, link });
    }
  };

  const handleRowClick = (
    e: React.MouseEvent<HTMLDivElement>,
    link: Link,
    index: number
  ) => {
    // Don't handle click if it's on a button or menu
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) {
      return;
    }

    const isColor = link.content_type === "color";
    const isRichText = link.content_type === "text";

    // If modifiers or drag: handle selection only
    if (e.metaKey || e.shiftKey || wasDraggingRef.current) {
      e.preventDefault();

      if (wasDraggingRef.current) return;

      if (e.metaKey) {
        const newSet = new Set(selectedIds);
        if (newSet.has(link.id)) {
          newSet.delete(link.id);
        } else {
          newSet.add(link.id);
          setLastSelectedIndex(index);
        }
        setSelectedIds(newSet);
      } else if (e.shiftKey && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const newSet = new Set(selectedIds);
        if (!e.metaKey) {
          newSet.clear();
        }

        for (let i = start; i <= end; i++) {
          newSet.add(displayLinks[i].id);
        }
        setSelectedIds(newSet);
      }
      return;
    }

    // Single click with no modifiers and no drag: Open
    if (shouldOpenRef.current) {
      if (isColor) {
        copyToClipboard(link.color_value || link.title);
      } else if (isRichText) {
        onEdit?.(link);
      } else {
        window.open(link.url, "_blank", "noopener,noreferrer");
      }
    }

    shouldOpenRef.current = false;
  };

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    // Don't start interactions if clicking buttons
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) return;

    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      e.preventDefault();
    }

    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    setDragStartIndex(index);
    setDragCurrentIndex(index);

    // If no modifiers, mark that we should potentially open on click
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
      shouldOpenRef.current = true;
    } else {
      shouldOpenRef.current = false;
    }

    // Handle immediate modifier selection logic
    if (e.shiftKey || e.metaKey) {
      if (e.shiftKey) {
        if (lastSelectedIndex !== null) {
          const start = Math.min(lastSelectedIndex, index);
          const end = Math.max(lastSelectedIndex, index);
          const newSet = new Set(selectedIds);
          if (!e.metaKey) newSet.clear();
          for (let i = start; i <= end; i++) {
            newSet.add(displayLinks[i].id);
          }
          setSelectedIds(newSet);
        } else {
          const newSet = new Set(selectedIds);
          newSet.add(displayLinks[index].id);
          setSelectedIds(newSet);
          setLastSelectedIndex(index);
        }
      } else if (e.metaKey) {
        const id = displayLinks[index].id;
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else {
          newSet.add(id);
          setLastSelectedIndex(index);
        }
        setSelectedIds(newSet);
      }
    }

    setFocusedIndex(index);
  };

  const handleMouseEnter = (index: number) => {
    if (isDragging && dragStartIndex !== null) {
      setDragCurrentIndex(index);

      const start = Math.min(dragStartIndex, index);
      const end = Math.max(dragStartIndex, index);

      const newSet = new Set<string>();
      for (let i = start; i <= end; i++) {
        newSet.add(displayLinks[i].id);
      }
      setSelectedIds(newSet);
    }
    setFocusedIndex(index);
  };

  // Batch Actions
  const handleBatchArchive = () => {
    selectedIds.forEach((id) => onArchive?.(id));
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    selectedIds.forEach((id) => onDelete?.(id));
    setSelectedIds(new Set());
  };

  const handleBatchPin = () => {
    selectedIds.forEach((id) => onPin?.(id));
  };

  const handleBatchUnpin = () => {
    selectedIds.forEach((id) => onUnpin?.(id));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        return;
      }

      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !isInputFocused) {
        e.preventDefault();

        if (focusedIndex === null) {
          setFocusedIndex(0);
          linkRefs.current[0]?.focus();
        } else {
          if (e.key === "ArrowDown") {
            const nextIndex =
              focusedIndex < displayLinks.length - 1 ? focusedIndex + 1 : 0;
            setFocusedIndex(nextIndex);
            linkRefs.current[nextIndex]?.focus();
          } else if (e.key === "ArrowUp") {
            const prevIndex =
              focusedIndex > 0 ? focusedIndex - 1 : displayLinks.length - 1;
            setFocusedIndex(prevIndex);
            linkRefs.current[prevIndex]?.focus();
          }
        }
      }

      if (e.key === "Escape") {
        clearSelection();
      }

      if (e.key === "Home" && !isInputFocused) {
        e.preventDefault();
        setFocusedIndex(0);
        linkRefs.current[0]?.focus();
      } else if (e.key === "End" && !isInputFocused) {
        e.preventDefault();
        const lastIndex = displayLinks.length - 1;
        setFocusedIndex(lastIndex);
        linkRefs.current[lastIndex]?.focus();
      }

      if (e.metaKey && selectedIds.size > 0) {
        if (e.key === "Backspace") {
          e.preventDefault();
          if (e.shiftKey) handleBatchDelete();
          else handleBatchArchive();
        }

        if (e.key === "a") {
          e.preventDefault();
          const newSet = new Set(displayLinks.map((l) => l.id));
          setSelectedIds(newSet);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [focusedIndex, displayLinks.length, selectedIds, displayLinks]);

  const renderMenuContent = (link: Link) => (
    <>
      <MenuItem onClick={() => onCopyUrl?.(link.url)}>
        <Copy className="h-4 w-4" />
        Copy URL
        <MenuShortcut>⌘C</MenuShortcut>
      </MenuItem>
      <MenuItem onClick={() => onEdit?.(link)}>
        <Edit className="h-4 w-4" />
        Edit
        <MenuShortcut>⌘E</MenuShortcut>
      </MenuItem>
      {link.is_pinned ? (
        <MenuItem onClick={() => onUnpin?.(link.id)}>
          <PinOff className="h-4 w-4" />
          Unpin
        </MenuItem>
      ) : (
        <MenuItem onClick={() => onPin?.(link.id)}>
          <Pin className="h-4 w-4" />
          Pin
        </MenuItem>
      )}
      <MenuItem onClick={() => onArchive?.(link.id)}>
        <Archive className="h-4 w-4" />
        Archive
        <MenuShortcut>⌘⌫</MenuShortcut>
      </MenuItem>
      <MenuSeparator />
      <MenuItem variant="destructive" onClick={() => onDelete?.(link.id)}>
        <Trash className="h-4 w-4" />
        Delete
        <MenuShortcut>⌘⇧⌫</MenuShortcut>
      </MenuItem>
    </>
  );

  if (links.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-neutral-400">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-50"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-900">No links yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            Start by adding a link using the input above
          </p>
        </div>
      </div>
    );
  }

  const pinnedLinks = links.filter((link) => link.is_pinned);
  const unpinnedLinks = links.filter((link) => !link.is_pinned);

  const renderLink = (link: Link, index: number, isPinned: boolean) => {
    const isColor = link.content_type === "color";
    const isRichText = link.content_type === "text";
    const isSelected = selectedIds.has(link.id);

    const richTextPreview = isRichText
      ? extractTextFromRichText(link.rich_text_content) || link.title
      : null;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "c") {
          e.preventDefault();
          onCopyUrl?.(link.url);
        } else if (e.key === "e") {
          e.preventDefault();
          onEdit?.(link);
        } else if (e.key === "a") {
          e.preventDefault();
          onArchive?.(link.id);
        } else if (e.key === "Backspace") {
          if (!e.shiftKey) {
            e.preventDefault();
            onArchive?.(link.id);
          } else {
            e.preventDefault();
            onDelete?.(link.id);
          }
        }
      }
    };

    return (
      <div
        key={link.id}
        onMouseDown={(e) => handleMouseDown(index, e)}
        onClick={(e) => handleRowClick(e, link, index)}
        onMouseEnter={() => handleMouseEnter(index)}
        onMouseLeave={() => {
          if (focusedIndex === index && !isDragging) setFocusedIndex(null);
        }}
        onKeyDown={handleKeyDown}
        onContextMenu={(e) => handleContextMenu(e, link)}
        className={cn(
          "group grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-lg px-3 py-2 transition-colors select-none cursor-pointer",
          isSelected
            ? "bg-neutral-200"
            : focusedIndex === index
            ? "bg-neutral-100"
            : "hover:bg-neutral-100"
        )}
      >
        <a
          ref={(el) => {
            linkRefs.current[index] = el;
          }}
          href={isColor || isRichText ? "#" : link.url}
          target={isColor || isRichText ? undefined : "_blank"}
          rel={isColor || isRichText ? undefined : "noopener noreferrer"}
          onClick={(e) => {
            // Prevent anchor default to let parent handle all navigation
            e.preventDefault();
          }}
          onFocus={() => setFocusedIndex(index)}
          className={cn(
            "flex min-w-0 items-center gap-3 focus:outline-none select-none",
            (isColor || isRichText) && "cursor-pointer"
          )}
          onDragStart={(e) => e.preventDefault()}
        >
          {isColor ? (
            <div
              className="h-5 w-5 flex-shrink-0 rounded-full border border-neutral-300"
              style={{ backgroundColor: link.color_value || link.title }}
            />
          ) : isRichText ? (
            <div className="h-5 w-5 flex-shrink-0 rounded bg-neutral-100 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-neutral-500" />
            </div>
          ) : (
            <Favicon url={link.favicon_url || ""} domain={link.domain} />
          )}
          <div className="min-w-0 flex-1 select-none">
            <div className="truncate text-[15px] text-neutral-900 select-none">
              {isRichText && richTextPreview
                ? richTextPreview
                : link.title || link.url}
            </div>
            <div className="truncate text-sm text-neutral-400 select-none">
              {isRichText ? "Rich text" : link.domain}
            </div>
          </div>
        </a>
        <div className="text-sm text-neutral-400 select-none">
          {formatDate(new Date(link.created_at))}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 transition-opacity",
            focusedIndex === index || isSelected ? "opacity-100" : "opacity-0"
          )}
        >
          {isPinned && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUnpin?.(link.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-neutral-300 transition-colors"
              title="Unpin"
            >
              <PinOff className="h-4 w-4" />
            </button>
          )}
          <Menu>
            <MenuTrigger>
              <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-neutral-300 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </MenuTrigger>
            <MenuPopup>{renderMenuContent(link)}</MenuPopup>
          </Menu>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div className="sticky top-[104px] z-10 grid grid-cols-[1fr_auto_auto] gap-4 bg-[#fafafa] py-4 text-xs font-medium text-neutral-400 relative select-none">
        <div>Title</div>
        <div>Created at</div>
        <div className="w-10"></div>
        <div className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-b from-[#fafafa] to-transparent pointer-events-none" />
      </div>
      <div className="space-y-0.5 py-4 relative">
        {pinnedLinks.length > 0 && (
          <>
            <div className="mb-4 mt-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider select-none">
              Pinned
            </div>
            {pinnedLinks.map((link, index) => renderLink(link, index, true))}
          </>
        )}
        {unpinnedLinks.length > 0 && (
          <>
            {pinnedLinks.length > 0 && (
              <div className="mb-4 mt-8 text-xs font-semibold text-neutral-500 uppercase tracking-wider select-none">
                All Links
              </div>
            )}
            {unpinnedLinks.map((link, index) =>
              renderLink(link, pinnedLinks.length + index, false)
            )}
          </>
        )}
      </div>

      {contextMenu && (
        <Menu
          open={true}
          onOpenChange={(open) => !open && setContextMenu(null)}
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
            {renderMenuContent(contextMenu.link)}
          </MenuPopup>
        </Menu>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white border border-neutral-200 shadow-xl rounded-lg p-1.5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 px-2 border-r border-neutral-200 pr-3 mr-1">
            <span className="text-sm font-medium text-neutral-900 select-none">
              {selectedIds.size} selected
            </span>
            <button
              onClick={clearSelection}
              className="text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleBatchArchive}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors select-none"
          >
            <Archive className="h-4 w-4" />
            Archive
          </button>

          <button
            onClick={handleBatchDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors select-none"
          >
            <Trash className="h-4 w-4" />
            Delete
          </button>

          <Menu>
            <MenuTrigger>
              <button className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors select-none">
                <MoreHorizontal className="h-4 w-4" />
                Actions
              </button>
            </MenuTrigger>
            <MenuPopup align="center" side="top">
              <MenuItem onClick={handleBatchPin}>
                <Pin className="h-4 w-4" />
                Pin Selected
              </MenuItem>
              <MenuItem onClick={handleBatchUnpin}>
                <PinOff className="h-4 w-4" />
                Unpin Selected
              </MenuItem>
            </MenuPopup>
          </Menu>
        </div>
      )}
    </div>
  );
}
