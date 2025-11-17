"use client";

import * as React from "react";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export function Sidebar({
  categories,
  selectedCategoryId,
  onCategorySelect,
}: SidebarProps) {
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const categoryRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    categoryRefs.current = categoryRefs.current.slice(0, categories.length + 2);
  }, [categories.length]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = index < categories.length + 1 ? index + 1 : 0;
      setFocusedIndex(nextIndex);
      categoryRefs.current[nextIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = index > 0 ? index - 1 : categories.length + 1;
      setFocusedIndex(prevIndex);
      categoryRefs.current[prevIndex]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (index === 0) {
        onCategorySelect(null);
      } else if (index <= categories.length) {
        onCategorySelect(categories[index - 1].id);
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
    <aside className="flex h-screen w-64 flex-col border-r border-gray-100 bg-white dark:border-gray-800 dark:bg-[#0d0d0d]">
      <div className="flex h-14 items-center border-b border-gray-100 px-4 dark:border-gray-800">
        <div className="flex h-7 w-7 items-center justify-center text-base font-medium text-gray-900 dark:text-gray-100">
          M
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Categories">
        <button
          ref={(el) => {
            categoryRefs.current[0] = el;
          }}
          onClick={() => onCategorySelect(null)}
          onKeyDown={(e) => handleKeyDown(e, 0)}
          className={cn(
            "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800",
            selectedCategoryId === null
              ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          )}
        >
          <span className="text-xs">All</span>
        </button>

        {categories.map((category, index) => {
          const isSelected = selectedCategoryId === category.id;
          const buttonIndex = index + 1;

          return (
            <button
              key={category.id}
              ref={(el) => {
                categoryRefs.current[buttonIndex] = el;
              }}
              onClick={() => onCategorySelect(category.id)}
              onKeyDown={(e) => handleKeyDown(e, buttonIndex)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800",
                isSelected
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                />
                <span>{category.name}</span>
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
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {category.count}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-2 dark:border-gray-800">
        <button
          ref={(el) => {
            categoryRefs.current[categories.length + 1] = el;
          }}
          onKeyDown={(e) => handleKeyDown(e, categories.length + 1)}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:focus:bg-gray-800"
        >
          <span>+ New Group</span>
        </button>
        <button
          className="mt-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:focus:bg-gray-800"
        >
          <span>Delete Group</span>
        </button>
      </div>
    </aside>
  );
}

