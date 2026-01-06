"use client";

import * as React from "react";
import type { Space } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  spaces: Space[];
  selectedSpaceId: string | null;
  onSpaceSelect: (spaceId: string | null) => void;
}

export function Sidebar({
  spaces,
  selectedSpaceId,
  onSpaceSelect,
}: SidebarProps) {
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const spaceRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    spaceRefs.current = spaceRefs.current.slice(0, spaces.length + 3);
  }, [spaces.length]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = index < spaces.length + 2 ? index + 1 : 0;
      setFocusedIndex(nextIndex);
      spaceRefs.current[nextIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = index > 0 ? index - 1 : spaces.length + 2;
      setFocusedIndex(prevIndex);
      spaceRefs.current[prevIndex]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (index === 0) {
        onSpaceSelect(null);
      } else if (index === 2) {
        onSpaceSelect("trash");
      } else if (index >= 3 && index < spaces.length + 3) {
        onSpaceSelect(spaces[index - 3].id);
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusedIndex(0);
      spaceRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const lastIndex = spaces.length + 2;
      setFocusedIndex(lastIndex);
      spaceRefs.current[lastIndex]?.focus();
    }
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[var(--border-primary)] bg-[var(--bg-l2-solid)]">
      <div className="flex h-14 items-center justify-between border-b border-[var(--border-primary)] px-4">
        <div className="flex h-7 w-7 items-center justify-center text-base font-medium text-[var(--text-primary)]">
          M
        </div>
        <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-l1-solid)] px-1.5 py-0.5 rounded border border-[var(--border-secondary)]">
          <kbd className="font-sans font-medium">[</kbd>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Spaces">
        <Button
          ref={(el) => {
            spaceRefs.current[0] = el;
          }}
          onClick={() => onSpaceSelect(null)}
          onKeyDown={(e) => handleKeyDown(e, 0)}
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 h-auto px-2 py-1.5 text-sm font-normal",
            selectedSpaceId === null
              ? "bg-[var(--bg-field-hover)] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-field-hover)] hover:text-[var(--text-primary)]",
          )}
        >
          <span className="text-xs">All</span>
        </Button>

        <Button
          ref={(el) => {
            spaceRefs.current[2] = el;
          }}
          onClick={() => onSpaceSelect("trash")}
          onKeyDown={(e) => handleKeyDown(e, 2)}
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 h-auto px-2 py-1.5 text-sm font-normal",
            selectedSpaceId === "trash"
              ? "bg-[var(--bg-field-hover)] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-field-hover)] hover:text-[var(--text-primary)]",
          )}
        >
          <span className="text-xs">Trash</span>
        </Button>

        <div className="my-2 h-px bg-[var(--border-primary)]" />

        {spaces.map((space, index) => {
          const isSelected = selectedSpaceId === space.id;
          const buttonIndex = index + 3;

          return (
            <Button
              key={space.id}
              ref={(el) => {
                spaceRefs.current[buttonIndex] = el;
              }}
              onClick={() => onSpaceSelect(space.id)}
              onKeyDown={(e) => handleKeyDown(e, buttonIndex)}
              variant="ghost"
              className={cn(
                "w-full justify-between gap-2 h-auto px-2 py-1.5 text-sm font-normal",
                isSelected
                  ? "bg-[var(--bg-selected)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-field-hover)] hover:text-[var(--text-primary)]",
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: space.color }}
                  aria-hidden="true"
                />
                <span>{space.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {isSelected && (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                <span className="text-xs text-[var(--text-tertiary)]">
                  {space.link_count}
                </span>
              </div>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
