"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Link } from "@/features/links/types";
import { cn, formatDate } from "@/lib/utils";
import { Favicon } from "@/components/ui/favicon";
import { Button } from "@/components/ui/button";
import { IconGripVertical, IconFile, IconPinnedOff } from "@tabler/icons-react";
import { extractTextFromRichText } from "@/lib/rich-text-utils";

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
  onCopyUrl?: (url: string) => void;
  onEdit?: (link: Link) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;

  onDelete?: (id: string) => void;
  isDragging: boolean;
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
  onCopyUrl,
  onEdit,
  onPin,
  onUnpin,

  onDelete,
  isDragging,
}: LinkListItemProps) {
  const isColor = link.content_type === "color";
  const isRichText = link.content_type === "text";

  const richTextPreview = isRichText
    ? extractTextFromRichText(link.rich_text_content) || link.title
    : null;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isSortableDragging ? 10 : "auto",
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === "c") {
        e.preventDefault();
        onCopyUrl?.(link.url);
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
    <div
      ref={setNodeRef}
      style={style}
      className="group/item relative flex items-center gap-2 w-full"
    >
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover/item:opacity-100 cursor-grab active:cursor-grabbing p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-opacity flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          // Prevent item selection when clicking drag handle
          e.stopPropagation();
        }}
      >
        <IconGripVertical className="w-4 h-4" />
      </div>

      <div
        onMouseDown={(e) => onMouseDown(index, e)}
        onClick={(e) => onClick(e, link, index)}
        onMouseEnter={() => onMouseEnter(index)}
        onMouseLeave={() => onMouseLeave(index)}
        onKeyDown={handleKeyDown}
        onContextMenu={(e) => onContextMenu(e, link)}
        className={cn(
          "group relative flex-1 grid grid-cols-[1fr_auto] ease-in will-change-transform duration-100 items-center gap-2 rounded-lg px-3 py-2 select-none cursor-pointer active:scale-[0.99] transition-transform",
          isSelected
            ? "bg-[var(--bg-l1-solid)]"
            : isFocused
            ? "bg-[var(--bg-l1-solid)]"
            : "hover:bg-[var(--bg-field-hover)]"
        )}
      >
        <a
          ref={linkRef}
          href={isColor || isRichText ? "#" : link.url}
          target={isColor || isRichText ? undefined : "_blank"}
          rel={isColor || isRichText ? undefined : "noopener noreferrer"}
          onClick={(e) => e.preventDefault()}
          onFocus={() => onFocus(index)}
          className="flex min-w-0 items-center gap-3 focus:outline-none select-none"
          onDragStart={(e) => e.preventDefault()}
        >
          {isColor ? (
            <div
              className="h-5 w-5 flex-shrink-0 rounded-full border border-[var(--border-secondary)]"
              style={{ backgroundColor: link.color_value || link.title }}
            />
          ) : isRichText ? (
            <div className="h-5 w-5 flex-shrink-0 rounded bg-[var(--bg-l1-solid)] flex items-center justify-center">
              <IconFile className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            </div>
          ) : (
            <Favicon url={link.favicon_url || ""} domain={link.domain} />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] text-[var(--text-primary)]">
              {isRichText && richTextPreview
                ? richTextPreview
                : link.title || link.url}
            </div>
            <div className="truncate text-sm text-[var(--text-tertiary)]">
              {isRichText ? "Rich text" : link.domain}
            </div>
          </div>
        </a>
        <div className="flex items-center gap-2">
          <div className="text-sm text-[var(--text-tertiary)]">
            {formatDate(new Date(link.created_at))}
          </div>
          <div
            className={cn(
              "flex items-center gap-1 transition-opacity",
              isFocused || isSelected
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            )}
          >
            {isPinned && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUnpin?.(link.id);
                }}
                className="h-8 w-8 hover:bg-[var(--bg-l2-solid)]"
                title="Unpin"
              >
                <IconPinnedOff className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
