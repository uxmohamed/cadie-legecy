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
import { Grid3x3, Trash2, Circle } from "lucide-react";

interface DockProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export function Dock({
  categories,
  selectedCategoryId,
  onCategorySelect,
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
    index: number
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
          className="flex items-center gap-1 px-2 py-1.5 bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-gray-800 rounded-lg"
          aria-label="Categories"
        >
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
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
                )}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="flex items-center gap-2">
                <span>All</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">
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
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
                )}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="flex items-center gap-2">
                <span>Trash</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                  2
                </kbd>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Separator if there are categories */}
          {categories.length > 0 && (
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-800 mx-1" />
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
                        ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
                    )}
                  >
                    <Circle
                      className="h-4 w-4"
                      fill={category.color}
                      stroke={category.color}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="flex items-center gap-2">
                    <span>{category.name}</span>
                    {(category.count ?? 0) > 0 && (
                      <span className="text-xs text-gray-400">
                        ({category.count})
                      </span>
                    )}
                    <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">
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
