"use client";

import * as React from "react";
import type { Link } from "@/types";
import { cn, formatDate } from "@/lib/utils";

interface LinkListProps {
  links: Link[];
}

export function LinkList({ links }: LinkListProps) {
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const linkRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    linkRefs.current = linkRefs.current.slice(0, links.length);
  }, [links.length]);

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
      <div className="sticky top-0 z-10 mb-8 grid grid-cols-[1fr_auto] gap-4 bg-[#fafafa] py-4 text-xs font-medium text-neutral-400">
        <div>Title</div>
        <div>Created at</div>
      </div>
      <div className="space-y-0.5">
        {links.map((link, index) => {
              const faviconUrl = link.favicon_url || `https://www.google.com/s2/favicons?domain=${link.domain}&sz=16`;

          return (
            <a
              key={link.id}
              ref={(el) => {
                linkRefs.current[index] = el;
              }}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onFocus={() => setFocusedIndex(index)}
              className={cn(
                "group grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg px-3 py-2 hover:bg-neutral-200 focus:outline-none focus:bg-neutral-200",
                focusedIndex === index && "bg-neutral-200"
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={faviconUrl}
                  alt=""
                  className="h-5 w-5 flex-shrink-0 rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] text-neutral-900">
                        {link.title || link.url}
                      </div>
                      <div className="truncate text-sm text-neutral-400">
                        {link.domain}
                      </div>
                    </div>
              </div>
                  <div className="text-sm text-neutral-400">
                    {formatDate(new Date(link.created_at))}
                  </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

