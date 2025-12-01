"use client";

import * as React from "react";

import type { Link } from "@/features/links/types";
import { cn, formatDate, cleanUrl } from "@/lib/utils";
import { Favicon } from "@/components/ui/favicon";
import { Button } from "@/components/ui/button";
import {
  IconFile,
  IconPinnedOff,
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
    <div className="group/item relative flex items-center gap-2 w-full">
      <div
        onMouseDown={(e) => onMouseDown(index, e)}
        onClick={(e) => onClick(e, link, index)}
        onMouseEnter={() => onMouseEnter(index)}
        onMouseLeave={() => onMouseLeave(index)}
        onKeyDown={handleKeyDown}
        onContextMenu={(e) => onContextMenu(e, link)}
        className={cn(
          "group relative flex-1 grid grid-cols-[1fr_150px] ease-in will-change-transform items-center gap-1 rounded-lg py-4 px-2 select-none cursor-pointer active:scale-[0.99] transition-transform",
          isSelected
            ? "bg-[var(--bg-field-hover)]"
            : isFocused
            ? "bg-[var(--bg-field-hover)]"
            : "hover:bg-[var(--bg-field-hover)]"
        )}
      >
        <a
          ref={linkRef}
          href={isColor ? "#" : link.url}
          target={isColor ? undefined : "_blank"}
          rel={isColor ? undefined : "noopener noreferrer"}
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
          ) : (
            <Favicon url={link.favicon_url || ""} domain={link.domain} className="h-5 w-5" />
          )}
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <div className="truncate text-sm leading-4 text-[rgba(0,0,0,0.90)] font-[470]">
              {link.title || link.url}
            </div>
            {!isColor && (
              <div
                className={cn(
                  "truncate text-sm leading-4 text-[var(--text-tertiary)] font-[470]",
                  isSelected || isFocused
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                )}
              >
                {cleanUrl(link.url)}
              </div>
            )}
          </div>
        </a>
        <div className="flex items-center justify-end">
          <div className="text-[13px] text-[var(--text-tertiary)] font-[470]">
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
