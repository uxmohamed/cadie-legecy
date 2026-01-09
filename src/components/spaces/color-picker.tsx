"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SpaceColor =
  | "blue"
  | "sky"
  | "cyan"
  | "teal"
  | "green"
  | "emerald"
  | "lime"
  | "yellow"
  | "amber"
  | "orange"
  | "red"
  | "crimson"
  | "pink"
  | "hotPink"
  | "purple"
  | "violet"
  | "indigo"
  | "brown"
  | "slate";

export const SPACE_COLORS: Record<SpaceColor, { cssVar: string; label: string }> = {
  blue: { cssVar: "#2783DE", label: "Blue" },
  sky: { cssVar: "#007AFF", label: "Sky" },
  cyan: { cssVar: "#00D3F2", label: "Cyan" },
  teal: { cssVar: "#30B0C7", label: "Teal" },
  green: { cssVar: "#48E7A5", label: "Green" },
  emerald: { cssVar: "#34C759", label: "Emerald" },
  lime: { cssVar: "#BBF451", label: "Lime" },
  yellow: { cssVar: "#FFCB30", label: "Yellow" },
  amber: { cssVar: "#FF9F0A", label: "Amber" },
  orange: { cssVar: "#EF5A3C", label: "Orange" },
  red: { cssVar: "#FF5050", label: "Red" },
  crimson: { cssVar: "#FF3B30", label: "Crimson" },
  pink: { cssVar: "#EF95C2", label: "Pink" },
  hotPink: { cssVar: "#FF2D55", label: "Hot Pink" },
  purple: { cssVar: "#A684FF", label: "Purple" },
  violet: { cssVar: "#AF52DE", label: "Violet" },
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
