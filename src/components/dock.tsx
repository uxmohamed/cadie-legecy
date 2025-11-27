"use client";

import * as React from "react";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useShortcuts } from "@/components/shortcut-context";
import { IconPlus, IconMenu, IconTrash, IconCircle } from "@tabler/icons-react";

interface DockProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  onAddClick: () => void;
}

export function Dock({
  categories,
  selectedCategoryId,
  onCategorySelect,
  onAddClick,
}: DockProps) {
  const { registerShortcut, unregisterShortcut } = useShortcuts();
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const categoryRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    categoryRefs.current = categoryRefs.current.slice(0, categories.length + 2);
  }, [categories.length]);

  // Register keyboard shortcuts
  React.useEffect(() => {
    // All - shortcut 1
    registerShortcut({
      key: "1",
      description: "Show all items",
      category: "Navigation",
      action: () => onCategorySelect(null),
    });

    // Trash - shortcut 2
    registerShortcut({
      key: "2",
      description: "Show trash",
      category: "Navigation",
      action: () => onCategorySelect("trash"),
    });

    // Categories - shortcuts 3-9
    categories.slice(0, 7).forEach((category, index) => {
      const key = String(index + 3);
      registerShortcut({
        key,
        description: `Show ${category.name}`,
        category: "Navigation",
        action: () => onCategorySelect(category.id),
      });
    });

    return () => {
      unregisterShortcut("1");
      unregisterShortcut("2");
      categories.slice(0, 7).forEach((_, index) => {
        unregisterShortcut(String(index + 3));
      });
    };
  }, [categories, onCategorySelect, registerShortcut, unregisterShortcut]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = index < categories.length + 1 ? index + 1 : 0;
      setFocusedIndex(nextIndex);
      categoryRefs.current[nextIndex]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = index > 0 ? index - 1 : categories.length + 1;
      setFocusedIndex(prevIndex);
      categoryRefs.current[prevIndex]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (index === 0) {
        onCategorySelect(null);
      } else if (index === 1) {
        onCategorySelect("trash");
      } else if (index >= 2 && index < categories.length + 2) {
        onCategorySelect(categories[index - 2].id);
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusedIndex(0);
      categoryRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const lastIndex = categories.length + 1;
      setFocusedIndex(lastIndex);
      categoryRefs.current[lastIndex]?.focus();
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <TooltipProvider delayDuration={300}>
        <nav
          className="flex items-center gap-1 px-2 py-1.5 bg-[var(--bg-l2-solid)] border border-[var(--border-primary)] rounded-lg"
          aria-label="Categories"
        >
          {/* Add Button - Primary */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onAddClick}
                className="h-8 w-8 p-0 rounded-md bg-[var(--accent-blue-primary)] hover:bg-[var(--accent-blue-secondary)] text-[var(--text-inverse)] border-0"
              >
                <IconPlus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="flex items-center gap-2 ">
                <span>Add</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-[var(--bg-emphasis)] text-[var(--text-inverse)] rounded">
                  C
                </kbd>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Separator */}
          <div className="w-px h-5 bg-[var(--border-primary)] mx-1" />

          {/* All Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={(el) => {
                  categoryRefs.current[0] = el;
                }}
                onClick={() => onCategorySelect(null)}
                onKeyDown={(e) => handleKeyDown(e, 0)}
                variant="ghost"
                className={cn(
                  "h-8 w-8 p-0 rounded-md",
                  selectedCategoryId === null
                    ? "bg-[var(--bg-field-hover)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-field-hover)]",
                )}
              >
                <IconMenu className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="flex items-center gap-2">
                <span>All</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-[var(--bg-emphasis)] text-[var(--text-inverse)] rounded">
                  1
                </kbd>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Trash Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={(el) => {
                  categoryRefs.current[1] = el;
                }}
                onClick={() => onCategorySelect("trash")}
                onKeyDown={(e) => handleKeyDown(e, 1)}
                variant="ghost"
                className={cn(
                  "h-8 w-8 p-0 rounded-md",
                  selectedCategoryId === "trash"
                    ? "bg-[var(--bg-field-hover)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-field-hover)]",
                )}
              >
                <IconTrash className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="flex items-center gap-2">
                <span>Trash</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-[var(--bg-emphasis)] text-[var(--text-inverse)] rounded">
                  2
                </kbd>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Separator if there are categories */}
          {categories.length > 0 && (
            <div className="w-px h-5 bg-[var(--border-primary)] mx-1" />
          )}

          {/* Category Buttons */}
          {categories.slice(0, 7).map((category, index) => {
            const isSelected = selectedCategoryId === category.id;
            const buttonIndex = index + 2;
            const shortcutKey = index + 3;

            return (
              <Tooltip key={category.id}>
                <TooltipTrigger asChild>
                  <Button
                    ref={(el) => {
                      categoryRefs.current[buttonIndex] = el;
                    }}
                    onClick={() => onCategorySelect(category.id)}
                    onKeyDown={(e) => handleKeyDown(e, buttonIndex)}
                    variant="ghost"
                    className={cn(
                      "h-8 w-8 p-0 rounded-md relative",
                      isSelected
                        ? "bg-[var(--bg-field-hover)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-field-hover)]",
                    )}
                  >
                    <IconCircle className="h-2 w-2 text-[var(--text-tertiary)] fill-current" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8">
                      <IconCircle className="h-2 w-2 text-[var(--text-tertiary)] fill-current" />
                    </div>
                    {(category.count ?? 0) > 0 && (
                      <span className="text-xs text-[var(--text-tertiary)]">
                        ({category.count})
                      </span>
                    )}
                    <kbd className="px-1.5 py-0.5 text-xs bg-[var(--bg-l1-solid)] text-[var(--text-primary)] rounded">
                      {shortcutKey}
                    </kbd>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>
    </div>
  );
}
