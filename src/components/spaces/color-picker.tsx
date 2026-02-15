"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SpaceColor =
  | "blue"
  | "cyan"
  | "teal"
  | "emerald"
  | "lime"
  | "yellow"
  | "amber"
  | "crimson"
  | "pink"
  | "hotPink"
  | "purple"
  | "indigo"
  | "brown"
  | "slate";

export const SPACE_COLORS: Record<SpaceColor, { cssVar: string; label: string }> = {
  blue: { cssVar: "#2783DE", label: "Blue" },
  cyan: { cssVar: "#00D3F2", label: "Cyan" },
  teal: { cssVar: "#30B0C7", label: "Teal" },
  emerald: { cssVar: "#34C759", label: "Emerald" },
  lime: { cssVar: "#BBF451", label: "Lime" },
  yellow: { cssVar: "#FFCB30", label: "Yellow" },
  amber: { cssVar: "#FF9F0A", label: "Amber" },
  crimson: { cssVar: "#FF3B30", label: "Crimson" },
  pink: { cssVar: "#EF95C2", label: "Pink" },
  hotPink: { cssVar: "#FF2D55", label: "Hot Pink" },
  purple: { cssVar: "#A684FF", label: "Purple" },
  indigo: { cssVar: "#5856D6", label: "Indigo" },
  brown: { cssVar: "#A2845E", label: "Brown" },
  slate: { cssVar: "#64748B", label: "Slate" },
};

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  className?: string;
}

export function ColorPicker({ selectedColor, onColorSelect, className }: ColorPickerProps) {
  return (
    <div className={cn("grid grid-cols-7 gap-x-4 gap-y-3 w-full", className)}>
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
              "ring-2",
              isSelected
                ? "ring-current"
                : "ring-transparent hover:ring-current"
            )}
            style={{ backgroundColor: color.cssVar, color: color.cssVar }}
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
