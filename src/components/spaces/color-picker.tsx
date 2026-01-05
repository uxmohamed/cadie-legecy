"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SpaceColor = 
  | "blue"
  | "red"
  | "green"
  | "yellow"
  | "purple"
  | "pink"
  | "teal";

export const SPACE_COLORS: Record<SpaceColor, { cssVar: string; label: string }> = {
  blue: { cssVar: "var(--accent-blue-primary)", label: "Blue" },
  red: { cssVar: "var(--accent-red-primary)", label: "Red" },
  green: { cssVar: "var(--accent-green-primary)", label: "Green" },
  yellow: { cssVar: "var(--accent-yellow-primary)", label: "Yellow" },
  purple: { cssVar: "var(--space-purple)", label: "Purple" },
  pink: { cssVar: "var(--space-pink)", label: "Pink" },
  teal: { cssVar: "var(--space-teal)", label: "Teal" },
};

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  className?: string;
}

export function ColorPicker({ selectedColor, onColorSelect, className }: ColorPickerProps) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {(Object.keys(SPACE_COLORS) as SpaceColor[]).map((colorKey) => {
        const color = SPACE_COLORS[colorKey];
        const isSelected = selectedColor === color.cssVar;
        
        return (
          <button
            key={colorKey}
            type="button"
            onClick={() => onColorSelect(color.cssVar)}
            className={cn(
              "relative h-10 w-10 rounded-full transition-all",
              "ring-2 ring-offset-2 ring-offset-[var(--bg-l2-solid)]",
              isSelected
                ? "ring-[var(--accent-blue-primary)] scale-110"
                : "ring-transparent hover:ring-[var(--border-hover)] hover:scale-105"
            )}
            style={{ backgroundColor: color.cssVar }}
            aria-label={`Select ${color.label} color`}
            title={color.label}
          >
            {isSelected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-white drop-shadow-lg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
