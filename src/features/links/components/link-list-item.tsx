import { Favicon } from "@/components/ui/favicon";
import { Menu, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { extractTextFromRichText } from "@/lib/rich-text-utils";
import { cn, formatDate } from "@/lib/utils";
import type { Link } from "@/types";
import { FileText, MoreHorizontal, MoreVertical, PinOff } from "lucide-react";
import { LinkContextMenu } from "./link-context-menu";

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
    index: number,
  ) => void;
  onMouseEnter: (index: number) => void;
  onMouseLeave: (index: number) => void;
  onFocus: (index: number) => void;
  onContextMenu: (e: React.MouseEvent, link: Link) => void;
  onCopyUrl?: (url: string) => void;
  onEdit?: (link: Link) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onArchive?: (id: string) => void;
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
  onArchive,
  onDelete,
  isDragging,
}: LinkListItemProps) {
  const isColor = link.content_type === "color";
  const isRichText = link.content_type === "text";

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
    <div className="flex items-center justify-center">
      <div
        onMouseDown={(e) => onMouseDown(index, e)}
        onClick={(e) => onClick(e, link, index)}
        onMouseEnter={() => onMouseEnter(index)}
        onMouseLeave={() => onMouseLeave(index)}
        onKeyDown={handleKeyDown}
        onContextMenu={(e) => onContextMenu(e, link)}
        className={cn(
          "group w-full grid grid-cols-[1fr_auto_auto] ease-in will-change-transform duration-100 items-center gap-2 rounded-lg px-3 py-2 select-none cursor-pointer active:scale-[0.99] transition-transform",
          isSelected
            ? "bg-neutral-200"
            : isFocused
              ? "bg-neutral-100"
              : "hover:bg-neutral-100",
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
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] text-neutral-900">
              {isRichText && richTextPreview
                ? richTextPreview
                : link.title || link.url}
            </div>
            <div className="truncate text-sm text-neutral-400">
              {isRichText ? "Rich text" : link.domain}
            </div>
          </div>
        </a>
        <div className="text-sm text-neutral-400">
          {formatDate(new Date(link.created_at))}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 transition-opacity",
            isFocused || isSelected
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100",
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
        </div>
      </div>
      <Menu>
        <MenuTrigger
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-neutral-300 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </MenuTrigger>
        <MenuPopup>
          <LinkContextMenu
            link={link}
            onCopyUrl={onCopyUrl}
            onEdit={onEdit}
            onPin={onPin}
            onUnpin={onUnpin}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        </MenuPopup>
      </Menu>
    </div>
  );
}
