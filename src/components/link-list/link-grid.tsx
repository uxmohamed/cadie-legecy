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
      className={`mb-4 break-inside-avoid rounded-xl border overflow-hidden cursor-pointer group transition-colors ${
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
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4">
            {pinnedLinks.map((link, i) => (
              <LinkGridCard
                key={link.id}
                link={link}
                index={i}
                isSelected={selectedIds.has(link.id)}
                onMouseDown={onItemMouseDown}
                onClick={onItemClick}
                onContextMenu={onContextMenu}
              />
            ))}
          </div>
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
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4">
            {unpinnedLinks.map((link, i) => (
              <LinkGridCard
                key={link.id}
                link={link}
                index={pinnedLinks.length + i}
                isSelected={selectedIds.has(link.id)}
                onMouseDown={onItemMouseDown}
                onClick={onItemClick}
                onContextMenu={onContextMenu}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
