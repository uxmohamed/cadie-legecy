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
  onUnpin
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
  const [dragStartIndex, setDragStartIndex] = React.useState<number | null>(null);
  const [dragCurrentIndex, setDragCurrentIndex] = React.useState<number | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<number | null>(null);
  
  const linkRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const previousLengthRef = React.useRef(links.length);

  // Helper to get flattened list of links for index calculation
  // We need to maintain the same order as rendered: pinned first, then unpinned
  const displayLinks = React.useMemo(() => {
    const pinned = links.filter(l => l.is_pinned);
    const unpinned = links.filter(l => !l.is_pinned);
    return [...pinned, ...unpinned];
  }, [links]);

  React.useEffect(() => {
    linkRefs.current = linkRefs.current.slice(0, displayLinks.length);
    
    // If links were removed and we had a focused item
    if (displayLinks.length < previousLengthRef.current && focusedIndex !== null) {
      const newFocusIndex = Math.min(focusedIndex, displayLinks.length - 1);
      setFocusedIndex(newFocusIndex);
    }

    // Clean up selected IDs for items that no longer exist
    setSelectedIds(prev => {
      const next = new Set(prev);
      let changed = false;
      for (const id of next) {
        if (!displayLinks.find(l => l.id === id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    
    previousLengthRef.current = displayLinks.length;
  }, [displayLinks.length, focusedIndex, displayLinks]);

  // Global mouse up handler to end dragging
  React.useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStartIndex(null);
        setDragCurrentIndex(null);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

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
      // If right-clicking an unselected item, clear selection and select it
      // Unless Shift/Cmd is held, but for simple context menu behavior usually we reset
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
         setSelectedIds(new Set());
      }
      setContextMenu({ x: e.clientX, y: e.clientY, link });
    } else {
      // If right-clicking a selected item, keep selection
      setContextMenu({ x: e.clientX, y: e.clientY, link });
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, link: Link, index: number) => {
    const isColor = link.content_type === "color";
    const isRichText = link.content_type === "text";
    
    // Always prevent default behavior first to handle selection logic
    // We will manually navigate or perform action if it's a "pure" click
    
    // Check if we are in selection mode (either modifying selection or finishing a drag)
    // If isDragging is true, it means we just finished a drag, so we shouldn't open the link.
    // However, mouseup happens before click, so isDragging might already be false here.
    // We can check if selection size changed recently or if modifiers are held.

    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle logic
      if (e.metaKey || e.ctrlKey) {
        const newSet = new Set(selectedIds);
        if (newSet.has(link.id)) {
            newSet.delete(link.id);
        } else {
            newSet.add(link.id);
            setLastSelectedIndex(index);
        }
        setSelectedIds(newSet);
      } else if (e.shiftKey && lastSelectedIndex !== null) {
        // Range select from last selected
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const newSet = new Set(selectedIds);
        // If we want to replace selection like standard OS:
        // newSet.clear(); 
        // But typically web apps might add to selection or replace.
        // Let's assume standard Shift+Click extends selection from anchor.
        // To make it cleaner, let's clear and select the range if no meta key.
        if (!e.metaKey && !e.ctrlKey) {
           newSet.clear();
        }
        
        for (let i = start; i <= end; i++) {
            newSet.add(displayLinks[i].id);
        }
        setSelectedIds(newSet);
      }
      return;
    }

    // If we are not using modifiers, check if we are just clicking to open
    // But if we have a selection, maybe we want to clear it?
    // Standard behavior: Click on an item clears other selections and selects this one (or opens it).
    // The user said "by mistake I click into the link and it's open".
    // This implies they tried to drag/select and it opened.
    
    // If we just finished dragging (which we can't easily detect here since mouseup fired),
    // we rely on the fact that dragging usually doesn't trigger a click on the element if cursor moved enough.
    // But if they just clicked to select (without modifier), they might expect selection, not open.
    // BUT standard link behavior is open on click.
    
    // If they want to select individual items without opening, they usually use modifiers or specific selection areas.
    // However, the user asked: "control for selecting individual items shift and click... not to do this open by mistake"
    
    // If we simply click, we open.
    if (isColor) {
        e.preventDefault();
        copyToClipboard(link.color_value || link.title);
    } else if (isRichText) {
        e.preventDefault();
        onEdit?.(link);
    } else {
        // Regular URL link
        // If selectedIds has items, clicking a non-selected item usually clears selection and navigates?
        // Or just navigates?
        // User wants to avoid accidental open.
        // Maybe we should only open if NO selection modifiers were used AND we didn't just drag?
        // Since we prevented default for modifiers above, we are good there.
        
        // The issue "click into the link and it's open" likely happens when they try to start a drag on the link text itself.
        // We already prevent drag start on links in handleMouseDown. 
        // But if they click-down on link, move mouse, click-up, it might trigger click.
        
        // To prevent accidental open during "selection interactions", we can check if we are currently "selecting".
        // Since we don't support drag-start on the link anchor itself (see handleMouseDown), 
        // the only way to drag-select is starting from the padding/void area of the row.
        
        // If the user wants "control click" to select without opening: implemented above.
        
        // If the user means they want to click the row to select (like a file manager), and double click to open?
        // Or click text to open, click row to select?
        // Currently the whole row is the anchor (except buttons).
        
        // Let's allow opening ONLY if no modifiers.
        // And since we handled modifiers above, we just let it fall through here.
        // We don't need to do anything special for regular clicks unless we want to change 'single click open' paradigm.
    }
  };

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    // Don't start drag if clicking buttons/links
    // The anchor tag covers the whole row. 
    // If we want to allow drag-select by clicking ANYWHERE, we must prevent the anchor from stealing the drag?
    // OR we treat the anchor as the drag handle too?
    
    // The user said "selecting multiple items by dragging the cursor".
    // If I click on "Google" link and drag, I expect to select "Google" and "Facebook" below it.
    // I do NOT expect to drag the "Google" link itself (ghost image).
    
    // So we should prevent default on the anchor for drag interactions?
    // But we need click to work.
    
    // We can prevent drag start on the anchor if we want our custom drag logic.
    // But we need to know if it's a click or a drag.
    
    // Solution: Handle MouseDown on the DIV wrapper.
    // If we click the anchor, it bubbles to div.
    
    // If modifiers are held, we definitely want selection logic, not link drag/click.
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
        e.preventDefault(); // Prevent text selection/native drag
    }

    setIsDragging(true);
    setDragStartIndex(index);
    setDragCurrentIndex(index);
    
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
        // If clicking without modifiers, we start a new selection?
        // If we just CLICK, we want to open the link.
        // If we DRAG, we want to select.
        // We can't know yet.
        // But we can set the start index.
        
        // If we don't select immediately, we wait for move?
        // Let's select the current item on mousedown if we are not opening?
        // No, let's wait for drag to select if no modifiers.
    } else {
        // Handle immediate modifier selection
        if (e.shiftKey) {
            if (lastSelectedIndex !== null) {
                const start = Math.min(lastSelectedIndex, index);
                const end = Math.max(lastSelectedIndex, index);
                const newSet = new Set(selectedIds);
                if (!e.metaKey && !e.ctrlKey) newSet.clear();
                for (let i = start; i <= end; i++) {
                    newSet.add(displayLinks[i].id);
                }
                setSelectedIds(newSet);
            } else {
                 // Treat shift as single select if no last
                 const newSet = new Set(selectedIds);
                 newSet.add(displayLinks[index].id);
                 setSelectedIds(newSet);
                 setLastSelectedIndex(index);
            }
        } else if (e.metaKey || e.ctrlKey) {
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
        
        // Update selection based on drag range
        const start = Math.min(dragStartIndex, index);
        const end = Math.max(dragStartIndex, index);
        
        const newSet = new Set<string>();
        // If we are dragging, we usually clear previous selection and define new one
        // UNLESS meta key was held down at start?
        // For simplicity, let's make drag always create new selection set for now
        // (mimics simple file explorer behavior without complex modifier state tracking across drag)
        
        for (let i = start; i <= end; i++) {
            newSet.add(displayLinks[i].id);
        }
        setSelectedIds(newSet);
    }
    setFocusedIndex(index);
  };

  // Batch Actions
  const handleBatchArchive = () => {
    selectedIds.forEach(id => onArchive?.(id));
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    selectedIds.forEach(id => onDelete?.(id));
    setSelectedIds(new Set());
  };
  
  const handleBatchPin = () => {
      selectedIds.forEach(id => onPin?.(id));
  };

  const handleBatchUnpin = () => {
      selectedIds.forEach(id => onUnpin?.(id));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !isInputFocused) {
        e.preventDefault();
        
        if (focusedIndex === null) {
          setFocusedIndex(0);
          linkRefs.current[0]?.focus();
        } else {
          if (e.key === "ArrowDown") {
            const nextIndex = focusedIndex < displayLinks.length - 1 ? focusedIndex + 1 : 0;
            setFocusedIndex(nextIndex);
            linkRefs.current[nextIndex]?.focus();
          } else if (e.key === "ArrowUp") {
            const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : displayLinks.length - 1;
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

      if ((e.metaKey || e.ctrlKey) && selectedIds.size > 0) {
          if (e.key === 'Backspace') {
             e.preventDefault();
             if (e.shiftKey) handleBatchDelete();
             else handleBatchArchive();
          }
          
          // Select All
          if (e.key === 'a') {
              e.preventDefault();
              const newSet = new Set(displayLinks.map(l => l.id));
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

  // Separate links into pinned and unpinned
  const pinnedLinks = links.filter(link => link.is_pinned);
  const unpinnedLinks = links.filter(link => !link.is_pinned);

  const renderLink = (link: Link, index: number, isPinned: boolean) => {
    const isColor = link.content_type === "color";
    const isRichText = link.content_type === "text";
    const isSelected = selectedIds.has(link.id);
    
    // Extract preview text for rich text items
    const richTextPreview = isRichText 
      ? extractTextFromRichText(link.rich_text_content) || link.title
      : null;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.metaKey || e.ctrlKey)) {
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
          // Cmd+Delete archives
          if (!e.shiftKey) {
            e.preventDefault();
            onArchive?.(link.id);
          } else {
            // Cmd+Shift+Delete deletes
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
        onMouseEnter={() => handleMouseEnter(index)}
        onMouseLeave={() => {
          if (focusedIndex === index && !isDragging) setFocusedIndex(null);
        }}
        onKeyDown={handleKeyDown}
        onContextMenu={(e) => handleContextMenu(e, link)}
        className={cn(
          "group grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-lg px-3 py-2 transition-colors select-none",
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
          onClick={(e) => handleLinkClick(e, link, index)}
          onFocus={() => setFocusedIndex(index)}
          className={cn(
            "flex min-w-0 items-center gap-3 focus:outline-none",
            (isColor || isRichText) && "cursor-pointer"
          )}
          // Prevent default drag on the link so our custom drag works
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
            <Favicon 
              url={link.favicon_url || ""}
              domain={link.domain}
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] text-neutral-900">
              {isRichText && richTextPreview ? richTextPreview : (link.title || link.url)}
            </div>
            <div className="truncate text-sm text-neutral-400">
              {isRichText ? "Rich text" : link.domain}
            </div>
          </div>
        </a>
        <div className="text-sm text-neutral-400">
          {formatDate(new Date(link.created_at))}
        </div>
        <div className={cn(
          "flex items-center gap-1 transition-opacity",
          (focusedIndex === index || isSelected) ? "opacity-100" : "opacity-0"
        )}>
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
            <MenuPopup>
              {renderMenuContent(link)}
            </MenuPopup>
          </Menu>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div className="sticky top-[104px] z-10 grid grid-cols-[1fr_auto_auto] gap-4 bg-[#fafafa] py-4 text-xs font-medium text-neutral-400 relative">
        <div>Title</div>
        <div>Created at</div>
        <div className="w-10"></div>
        <div className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-b from-[#fafafa] to-transparent pointer-events-none" />
      </div>
      <div className="space-y-0.5 pt-4 relative">
        {pinnedLinks.length > 0 && (
          <>
            <div className="mb-4 mt-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Pinned
            </div>
            {pinnedLinks.map((link, index) => renderLink(link, index, true))}
          </>
        )}
        {unpinnedLinks.length > 0 && (
          <>
            {pinnedLinks.length > 0 && (
              <div className="mb-4 mt-8 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                All Links
              </div>
            )}
            {unpinnedLinks.map((link, index) => renderLink(link, pinnedLinks.length + index, false))}
          </>
        )}
      </div>
      
      {contextMenu && (
        <Menu open={true} onOpenChange={(open) => !open && setContextMenu(null)}>
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
                <span className="text-sm font-medium text-neutral-900">
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
            >
                <Archive className="h-4 w-4" />
                Archive
            </button>
            
             <button 
                onClick={handleBatchDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
                <Trash className="h-4 w-4" />
                Delete
            </button>
            
            <Menu>
                <MenuTrigger>
                     <button className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors">
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
