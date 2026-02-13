"use client";

import * as React from "react";
import type { Link } from "@/features/links/types";
import { Favicon } from "@/components/ui/favicon";
import { formatDate } from "@/lib/utils";
import { IconPinFilled } from "@tabler/icons-react";

interface LinkGridProps {
  pinnedLinks: Link[];
  unpinnedLinks: Link[];
  selectedIds: Set<string>;
  isTrashView: boolean;
  onItemMouseDown: (index: number, e: React.MouseEvent) => void;
  onItemClick: (
    e: React.MouseEvent<HTMLDivElement>,
    link: Link,
    index: number
  ) => void;
  onContextMenu: (e: React.MouseEvent, link: Link) => void;
  isAddingItem: boolean;
}

interface LinkGridCardProps {
  link: Link;
  index: number;
  isSelected: boolean;
  onMouseDown: (index: number, e: React.MouseEvent) => void;
  onClick: (
    e: React.MouseEvent<HTMLDivElement>,
    link: Link,
    index: number
  ) => void;
  onContextMenu: (e: React.MouseEvent, link: Link) => void;
}

function LinkGridCard({
  link,
  index,
  isSelected,
  onMouseDown,
  onClick,
  onContextMenu,
}: LinkGridCardProps) {
  const isColor = link.content_type === "color";

  const renderThumbnail = () => {
    if (link.og_image_url) {
      return (
        <img
          src={link.og_image_url}
          alt=""
          className="w-full object-cover"
          loading="lazy"
        />
      );
    }

    if (isColor) {
      return (
        <div
          className="w-full aspect-[4/3]"
          style={{ backgroundColor: link.color_value || link.title }}
        />
      );
    }

    return (
      <div className="w-full aspect-[4/3] bg-bg-muted flex items-center justify-center">
        <Favicon
          url={link.favicon_url || ""}
          domain={link.domain}
          className="h-8 w-8"
        />
      </div>
    );
  };

  return (
    <div
      onMouseDown={(e) => onMouseDown(index, e)}
      onClick={(e) => onClick(e, link, index)}
      onContextMenu={(e) => onContextMenu(e, link)}
      className={`mb-4 rounded-xl border overflow-hidden cursor-pointer group transition-colors ${
        isSelected
          ? "border-accent"
          : "border-border hover:border-border-hover"
      } bg-bg-surface`}
    >
      {/* Thumbnail area — natural height for OG images */}
      <div className="relative overflow-hidden">
        {renderThumbnail()}
        {link.is_pinned && (
          <div className="absolute top-2 right-2 rounded-full bg-bg/80 backdrop-blur-sm p-1">
            <IconPinFilled className="h-3 w-3 text-fg-subtle" />
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="px-3 py-2.5 space-y-1">
        {!isColor && (
          <div className="flex items-center gap-1.5">
            <Favicon
              url={link.favicon_url || ""}
              domain={link.domain}
              className="h-4 w-4"
            />
            <span className="text-xs text-fg-subtle truncate">
              {link.domain}
            </span>
          </div>
        )}
        <div className="text-sm font-medium text-fg line-clamp-2">
          {link.title || link.url}
        </div>
        <div className="text-xs text-fg-subtle">
          {formatDate(new Date(link.created_at))}
        </div>
      </div>
    </div>
  );
}

/**
 * Distribute items into columns in row-first (round-robin) order.
 * Item 0 → col 0, item 1 → col 1, ..., item N → col 0, etc.
 * This ensures horizontal reading order while allowing variable card heights.
 */
function useColumns<T>(items: T[], columnCount: number): T[][] {
  return React.useMemo(() => {
    const cols: T[][] = Array.from({ length: columnCount }, () => []);
    items.forEach((item, i) => {
      cols[i % columnCount].push(item);
    });
    return cols;
  }, [items, columnCount]);
}

function useResponsiveColumnCount() {
  const [count, setCount] = React.useState(5);

  React.useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setCount(2);
      else if (w < 768) setCount(3);
      else if (w < 1024) setCount(4);
      else setCount(5);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

interface MasonryGridProps {
  items: { link: Link; index: number }[];
  selectedIds: Set<string>;
  onItemMouseDown: (index: number, e: React.MouseEvent) => void;
  onItemClick: (e: React.MouseEvent<HTMLDivElement>, link: Link, index: number) => void;
  onContextMenu: (e: React.MouseEvent, link: Link) => void;
}

function MasonryGrid({ items, selectedIds, onItemMouseDown, onItemClick, onContextMenu }: MasonryGridProps) {
  const columnCount = useResponsiveColumnCount();
  const columns = useColumns(items, columnCount);

  return (
    <div className="flex gap-4">
      {columns.map((col, colIdx) => (
        <div key={colIdx} className="flex-1 min-w-0">
          {col.map(({ link, index }) => (
            <LinkGridCard
              key={link.id}
              link={link}
              index={index}
              isSelected={selectedIds.has(link.id)}
              onMouseDown={onItemMouseDown}
              onClick={onItemClick}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function LinkGrid({
  pinnedLinks,
  unpinnedLinks,
  selectedIds,
  isTrashView,
  onItemMouseDown,
  onItemClick,
  onContextMenu,
  isAddingItem,
}: LinkGridProps) {
  const pinnedItems = React.useMemo(
    () => pinnedLinks.map((link, i) => ({ link, index: i })),
    [pinnedLinks]
  );
  const unpinnedItems = React.useMemo(
    () => unpinnedLinks.map((link, i) => ({ link, index: pinnedLinks.length + i })),
    [unpinnedLinks, pinnedLinks.length]
  );

  return (
    <div className="py-4 space-y-6">
      {pinnedLinks.length > 0 && (
        <div>
          <div
            className={`mb-4 text-xs font-semibold text-fg-muted uppercase tracking-wider select-none transition-opacity duration-200 ${
              isAddingItem ? "opacity-20" : "opacity-100"
            }`}
          >
            Pinned
          </div>
          <MasonryGrid
            items={pinnedItems}
            selectedIds={selectedIds}
            onItemMouseDown={onItemMouseDown}
            onItemClick={onItemClick}
            onContextMenu={onContextMenu}
          />
        </div>
      )}

      {unpinnedLinks.length > 0 && (
        <div>
          {pinnedLinks.length > 0 && (
            <div
              className={`mb-4 text-xs font-semibold text-fg-muted uppercase tracking-wider select-none transition-opacity duration-200 ${
                isAddingItem ? "opacity-20" : "opacity-100"
              }`}
            >
              All Links
            </div>
          )}
          <MasonryGrid
            items={unpinnedItems}
            selectedIds={selectedIds}
            onItemMouseDown={onItemMouseDown}
            onItemClick={onItemClick}
            onContextMenu={onContextMenu}
          />
        </div>
      )}
    </div>
  );
}
