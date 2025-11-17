"use client";

import * as React from "react";
import type { Link } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
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
} from "lucide-react";

interface LinkListProps {
  links: Link[];
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onEdit?: (link: Link) => void;
  onCopyUrl?: (url: string) => void;
}

export function LinkList({ 
  links, 
  onDelete, 
  onArchive, 
  onEdit, 
  onCopyUrl 
}: LinkListProps) {
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const linkRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const previousLengthRef = React.useRef(links.length);

  React.useEffect(() => {
    linkRefs.current = linkRefs.current.slice(0, links.length);
    
    // If links were removed and we had a focused item
    if (links.length < previousLengthRef.current && focusedIndex !== null) {
      // Focus on the same index (next item) or the last item if we deleted the last one
      const newFocusIndex = Math.min(focusedIndex, links.length - 1);
      setFocusedIndex(newFocusIndex);
      
      // Focus after a short delay to ensure DOM is updated
      setTimeout(() => {
        linkRefs.current[newFocusIndex]?.focus();
      }, 0);
    }
    
    previousLengthRef.current = links.length;
  }, [links.length, focusedIndex]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Color copied to clipboard", "success");
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("Failed to copy color", "error");
    }
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
            const nextIndex = focusedIndex < links.length - 1 ? focusedIndex + 1 : 0;
            setFocusedIndex(nextIndex);
            linkRefs.current[nextIndex]?.focus();
          } else if (e.key === "ArrowUp") {
            const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : links.length - 1;
            setFocusedIndex(prevIndex);
            linkRefs.current[prevIndex]?.focus();
          }
        }
      }
      
      if (e.key === "Home" && !isInputFocused) {
        e.preventDefault();
        setFocusedIndex(0);
        linkRefs.current[0]?.focus();
      } else if (e.key === "End" && !isInputFocused) {
        e.preventDefault();
        const lastIndex = links.length - 1;
        setFocusedIndex(lastIndex);
        linkRefs.current[lastIndex]?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [focusedIndex, links.length]);

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

  return (
    <div className="w-full" ref={containerRef}>
      <div className="sticky top-0 z-10 mb-8 grid grid-cols-[1fr_auto_auto] gap-4 bg-[#fafafa] py-4 text-xs font-medium text-neutral-400">
        <div>Title</div>
        <div>Created at</div>
        <div className="w-10"></div>
      </div>
      <div className="space-y-0.5">
        {links.map((link, index) => {
          const isColor = link.content_type === "color";
          const faviconUrl = link.favicon_url || `https://www.google.com/s2/favicons?domain=${link.domain}&sz=16`;

          const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (isColor) {
              e.preventDefault();
              copyToClipboard(link.color_value || link.title);
            }
          };

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
                e.preventDefault();
                onDelete?.(link.id);
              }
            }
          };

          return (
            <div
              key={link.id}
              onMouseEnter={() => setFocusedIndex(index)}
              onMouseLeave={() => {
                if (focusedIndex === index) setFocusedIndex(null);
              }}
              onKeyDown={handleKeyDown}
              className={cn(
                "group grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-lg px-3 py-2 transition-colors",
                focusedIndex === index && "bg-neutral-100"
              )}
            >
              <a
              ref={(el) => {
                linkRefs.current[index] = el;
              }}
              href={isColor ? "#" : link.url}
              target={isColor ? undefined : "_blank"}
              rel={isColor ? undefined : "noopener noreferrer"}
              onClick={handleClick}
              onFocus={() => setFocusedIndex(index)}
              className={cn(
                  "flex min-w-0 items-center gap-3 focus:outline-none",
                isColor && "cursor-pointer"
              )}
            >
                {isColor ? (
                  <div
                    className="h-5 w-5 flex-shrink-0 rounded-full border border-neutral-300"
                    style={{ backgroundColor: link.color_value || link.title }}
                  />
                ) : (
                  <img
                    src={faviconUrl}
                    alt=""
                    className="h-5 w-5 flex-shrink-0 rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] text-neutral-900">
                    {link.title || link.url}
                  </div>
                  <div className="truncate text-sm text-neutral-400">
                    {link.domain}
                  </div>
                </div>
              </a>
              <div className="text-sm text-neutral-400">
                {formatDate(new Date(link.created_at))}
              </div>
              <div className={cn(
                "opacity-0 transition-opacity",
                focusedIndex === index && "opacity-100"
              )}>
                <Menu>
                  <MenuTrigger>
                    <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-neutral-200 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </MenuTrigger>
                  <MenuPopup>
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
                    <MenuItem onClick={() => onArchive?.(link.id)}>
                      <Archive className="h-4 w-4" />
                      Archive
                      <MenuShortcut>⌘A</MenuShortcut>
                    </MenuItem>
                    <MenuSeparator />
                    <MenuItem variant="destructive" onClick={() => onDelete?.(link.id)}>
                      <Trash className="h-4 w-4" />
                      Delete
                      <MenuShortcut>⌘⌫</MenuShortcut>
                    </MenuItem>
                  </MenuPopup>
                </Menu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

