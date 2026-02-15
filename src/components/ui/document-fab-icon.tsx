"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DocumentFabIconProps {
  title?: string | null;
  contentText?: string | null;
  fallbackText?: string | null;
  className?: string;
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickKeywordLines(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .match(/[a-z0-9]{3,}/g)
    ?.filter((token) => !["the", "and", "for", "with", "from", "this", "that"].includes(token)) ?? [];

  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([token]) => token);
}

export function DocumentFabIcon({
  title,
  contentText,
  fallbackText,
  className,
}: DocumentFabIconProps) {
  const seed = (contentText || title || fallbackText || "document").trim();
  const seedHash = hashString(seed);

  const hueA = seedHash % 360;
  const hueB = (hueA + 42 + (seedHash % 27)) % 360;
  const accentHue = (hueA + 200) % 360;

  const keywords = pickKeywordLines(seed);
  const bars = React.useMemo(() => {
    const lines = keywords.length > 0 ? keywords : [seed.slice(0, 10), seed.slice(10, 20), seed.slice(20, 30)];

    return lines.slice(0, 3).map((line, index) => {
      const lineHash = hashString(`${line}-${index}`);
      return {
        y: 6 + index * 4,
        width: 7 + (lineHash % 8),
        opacity: 0.5 + (lineHash % 35) / 100,
      };
    });
  }, [keywords, seed]);

  return (
    <div className={cn("h-5 w-5 flex-shrink-0 overflow-hidden rounded-[4px] border border-border-muted", className)}>
      <svg viewBox="0 0 20 20" className="h-full w-full" aria-hidden="true" role="img">
        <defs>
          <linearGradient id={`doc-fab-bg-${seedHash}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(${hueA} 55% 90%)`} />
            <stop offset="100%" stopColor={`hsl(${hueB} 60% 82%)`} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="20" height="20" fill={`url(#doc-fab-bg-${seedHash})`} />
        <path d="M14 0 L20 6 L20 0 Z" fill={`hsl(${accentHue} 45% 78%)`} opacity="0.85" />
        <rect x="3" y="4" width="11" height="1.5" rx="0.75" fill={`hsl(${accentHue} 20% 55%)`} opacity="0.5" />
        {bars.map((bar) => (
          <rect
            key={`${bar.y}-${bar.width}`}
            x="3"
            y={bar.y}
            width={bar.width}
            height="1.5"
            rx="0.75"
            fill={`hsl(${accentHue} 24% 42%)`}
            opacity={bar.opacity}
          />
        ))}
      </svg>
    </div>
  );
}
