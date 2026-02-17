"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SPACE_COLORS, type SpaceColor } from "@/features/spaces/constants/space-colors";

export { SPACE_COLORS, type SpaceColor };

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
