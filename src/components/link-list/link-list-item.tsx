"use client";

import * as React from "react";

import type { Link } from "@/features/links/types";
import { cn, formatDate, cleanUrl } from "@/lib/utils";
import { Favicon } from "@/components/ui/favicon";
import { Button } from "@/components/ui/button";
import {
  IconFile,
  IconPinnedOff,
  IconCornerDownLeft,
} from "@tabler/icons-react";

interface LinkListItemProps {
  link: Link;
  index: number;
  isPinned: boolean;
  isSelected: boolean;
  isFocused: boolean;
  linkRef: (el: HTMLAnchorElement | null) => void;
  onMouseDown: (index: number, e: React.MouseEvent) => void;
  onClick: (
    e: React.MouseEvent<HTMLDivElement>,
    link: Link,
    index: number
  ) => void;
  onMouseEnter: (index: number) => void;
  onMouseLeave: (index: number) => void;
  onFocus: (index: number) => void;
  onContextMenu: (e: React.MouseEvent, link: Link) => void;
  onCopy?: (url: string) => void;
  onEdit?: (link: Link) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onDelete?: (id: string) => void;
  isDragging: boolean;
  // Inline edit mode props
  isEditing?: boolean;
  editMode?: 'title' | 'url' | null;
  editValue?: string;
  onEditChange?: (value: string) => void;
  onEditSubmit?: () => void;
  onEditCancel?: () => void;
}

export function LinkListItem({
  link,
  index,
  isPinned,
  isSelected,
  isFocused,
  linkRef,
  onMouseDown,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onContextMenu,
  onCopy,
  onEdit,
  onPin,
  onUnpin,
  onDelete,
  isDragging,
  isEditing = false,
  editMode,
  editValue = "",
  onEditChange,
  onEditSubmit,
  onEditCancel,
}: LinkListItemProps) {
  const isColor = link.content_type === "color";
  const isImage = link.content_type === "image";
  const isDocument = link.content_type === "document";
  const isMetadataLoading = !isColor && !isImage && !isDocument && (link.fetch_status === "pending" || link.fetch_status === "fetching");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      // Use a small timeout to ensure the input is fully mounted after context menu closes
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isEditing]);

  // Handle click outside when editing - save changes on click outside
  React.useEffect(() => {
    if (!isEditing) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onEditSubmit?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, onEditSubmit]);

  // Handle edit input key events
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      onEditSubmit?.();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onEditCancel?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return; // Don't handle container keys when editing
    
    if (e.metaKey || e.ctrlKey) {
      if (e.key === "c") {
        e.preventDefault();
        onCopy?.(link.url);
      } else if (e.key === "e") {
        e.preventDefault();
        onEdit?.(link);
      } else if (e.key === "Backspace") {
        if (!e.shiftKey) {
          e.preventDefault();
          onDelete?.(link.id);
        } else {
          e.preventDefault();
          onDelete?.(link.id);
        }
      }
    }
  };

  return (
    <div ref={containerRef} className="group/item relative flex items-center w-full">
      <div
        onMouseDown={(e) => onMouseDown(index, e)}
        onClick={(e) => onClick(e, link, index)}
        onMouseEnter={() => onMouseEnter(index)}
        onMouseLeave={() => onMouseLeave(index)}
        onKeyDown={handleKeyDown}
        onContextMenu={(e) => onContextMenu(e, link)}
        className={cn(
          "group relative flex-1 grid grid-cols-[1fr_80px] sm:grid-cols-[1fr_120px] md:grid-cols-[1fr_150px] ease-in will-change-transform items-center gap-1 rounded-lg py-4 px-2 select-none cursor-pointer transition-transform",
          isEditing
            ? "bg-[var(--grey-50)]"
            : isSelected
            ? "bg-bg-hover"
            : isFocused
            ? "bg-bg-hover"
            : "hover:bg-bg-hover"
        )}
      >
        <a
          ref={linkRef}
          href={isColor || isImage ? "#" : link.url}
          target={isColor || isImage ? undefined : "_blank"}
          rel={isColor || isImage ? undefined : "noopener noreferrer nofollow"}
          onClick={(e) => e.preventDefault()}
          onFocus={() => onFocus(index)}
          className="flex min-w-0 items-center gap-3 focus-visible:outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none"
          onDragStart={(e) => e.preventDefault()}
        >
          {isColor ? (
            <div
              className="h-5 w-5 flex-shrink-0 rounded-full border border-border-muted"
              style={{ backgroundColor: link.color_value || link.title }}
            />
          ) : isImage ? (
            <img
              src={link.og_image_url || link.url}
              alt=""
              className="h-5 w-5 flex-shrink-0 rounded-[3px] object-cover"
            />
          ) : isDocument ? (
            <div className="h-5 w-5 flex-shrink-0 rounded-[3px] bg-bg-muted border border-border-muted flex items-center justify-center">
              <IconFile className="h-3.5 w-3.5 text-fg-subtle" />
            </div>
          ) : (
            <Favicon
              url={link.favicon_url || ""}
              domain={link.domain}
              className="h-5 w-5"
              isPending={isMetadataLoading}
            />
          )}
          <div className="min-w-0 flex-1">
            {isEditing && editMode === 'title' ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => onEditChange?.(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="w-full bg-transparent text-sm leading-4 text-fg font-[470] placeholder:text-fg-subtle outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
                autoComplete="off"
                aria-label="Edit link title"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className={cn(
                  "truncate text-sm leading-4 font-[470] transition-colors duration-500",
                  isMetadataLoading
                    ? "text-fg-subtle link-pending-shimmer"
                    : "text-fg"
                )}>
                  {link.title || link.url}
                </div>
                {!isColor && !isImage && (
                  <div
                    className={cn(
                      "hidden sm:block truncate text-sm leading-4 text-fg-subtle font-[470]",
                      isMetadataLoading && "link-pending-shimmer",
                      isSelected || isFocused
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {cleanUrl(link.url)}
                  </div>
                )}
              </div>
            )}
          </div>
        </a>
        <div className="relative flex items-center justify-end">
          {isEditing ? (
            <IconCornerDownLeft 
              className={`h-4 w-4 ${editValue?.trim() ? 'text-fg-subtle' : 'text-[var(--fg-disabled)] opacity-40'}`}
            />
          ) : (
            <>
              <div className={cn(
                "text-[11px] sm:text-[13px] text-fg-subtle font-[470] truncate text-right transition-opacity tabular-nums",
                isMetadataLoading && "link-pending-shimmer",
                isPinned && (isFocused || isSelected) && "opacity-0",
                isPinned && "group-hover:opacity-0"
              )}>
                {formatDate(new Date(link.created_at))}
              </div>
          {isPinned && (
            <div
              className={cn(
                "absolute right-0 flex items-center transition-opacity",
                isFocused || isSelected
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUnpin?.(link.id);
                }}
                className="h-8 w-8 hover:bg-bg-surface"
                aria-label="Unpin"
              >
                <IconPinnedOff className="h-4 w-4" />
              </Button>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
