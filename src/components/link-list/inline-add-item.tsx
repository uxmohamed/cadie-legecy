"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { IconCornerDownLeft } from "@tabler/icons-react";

interface InlineAddItemProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  className?: string;
}

/**
 * Gray square placeholder icon - using lighter grey-100 token
 */
function PlaceholderIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 flex-shrink-0 rounded-[3px] bg-bg-muted dark:bg-bg-surface",
        className
      )}
    />
  );
}

/**
 * Inline add item component that appears in the list when adding a new item.
 * Mimics the LinkListItem structure with an inline input field.
 */
export function InlineAddItem({
  value,
  onChange,
  onSubmit,
  onCancel,
  inputRef,
  className,
}: InlineAddItemProps) {
  const localInputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const resolvedInputRef = inputRef || localInputRef;
  
  // Track if we have content (for draft state)
  const hasContent = value.trim().length > 0;

  // Handle form submission
  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (hasContent) {
        onSubmit();
      }
    },
    [hasContent, onSubmit]
  );

  // Handle key events
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (hasContent) {
          onSubmit();
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    },
    [hasContent, onCancel, onSubmit]
  );

  // Handle click outside - always cancel
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onCancel();
      }
    };

    // Use mousedown to capture before focus changes
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCancel]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "group/item relative flex items-center w-full",
        className
      )}
    >
      <form
        onSubmit={handleSubmit}
        className="relative flex-1 grid grid-cols-[1fr_80px] sm:grid-cols-[1fr_120px] md:grid-cols-[1fr_150px] items-center gap-1 rounded-lg py-4 px-2"
      >
        <div className="flex min-w-0 items-center gap-3">
          <PlaceholderIcon />
          <div className="min-w-0 flex-1">
            <input
              ref={resolvedInputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a link, color, or image URL..."
              className="w-full bg-transparent text-sm leading-4 text-fg font-[470] placeholder:text-fg-subtle outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
              autoComplete="off"
              autoFocus
              aria-label="Enter a link, color, or image URL"
            />
          </div>
        </div>
        
        {/* Right side: Enter icon - disabled when empty */}
        <div className="relative flex items-center justify-end">
          <IconCornerDownLeft 
            className={`h-4 w-4 transition-opacity ${hasContent ? 'text-fg-subtle' : 'text-fg-disabled opacity-40'}`}
          />
        </div>

        {/* Explicit submit target keeps keyboard submit behavior consistent across browsers */}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
          Submit
        </button>
      </form>
    </div>
  );
}
