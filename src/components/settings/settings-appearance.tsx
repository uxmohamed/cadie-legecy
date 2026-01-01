"use client";

import * as React from "react";
import { useTheme } from "@/components/theme-provider";
import { Label } from "@/components/ui/label";
import { IconCircleCheckFilled } from "@tabler/icons-react";

const themeOptions = [
  {
    id: "system" as const,
    label: "System",
    description: "Match system settings",
    preview: (
      <div className="relative h-full w-full bg-[#F5F5F5]">
        {/* Container with border */}
        <div className="absolute inset-2 rounded border border-gray-100 shadow-sm overflow-hidden">
          {/* Light half - left side */}
          <div 
            className="absolute inset-0 bg-white"
            style={{ clipPath: 'inset(0 50% 0 0)' }}
          >
            <div className="space-y-1.5 p-2">
              <div className="h-1.5 w-8 rounded-full bg-gray-100" />
              <div className="h-1.5 w-16 rounded-full bg-gray-100" />
              <div className="h-1.5 w-12 rounded-full bg-gray-100" />
            </div>
          </div>
          {/* Dark half - right side */}
          <div 
            className="absolute inset-0 bg-[#1C1C1C]"
            style={{ clipPath: 'inset(0 0 0 50%)' }}
          >
            <div className="space-y-1.5 p-2">
              <div className="h-1.5 w-8 rounded-full bg-[#333]" />
              <div className="h-1.5 w-16 rounded-full bg-[#333]" />
              <div className="h-1.5 w-12 rounded-full bg-[#333]" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "light" as const,
    label: "Light",
    description: "For bright environments",
    preview: (
      <div className="relative h-full w-full bg-[#F5F5F5]">
        <div className="absolute inset-2 rounded bg-white shadow-sm border border-gray-100">
          <div className="space-y-1.5 p-2">
            <div className="h-1.5 w-8 rounded-full bg-gray-100" />
            <div className="h-1.5 w-16 rounded-full bg-gray-100" />
            <div className="h-1.5 w-12 rounded-full bg-gray-100" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "dark" as const,
    label: "Dark",
    description: "For low light",
    preview: (
      <div className="relative h-full w-full bg-[#111]">
        <div className="absolute inset-2 rounded bg-[#1C1C1C]">
          <div className="space-y-1.5 p-2">
            <div className="h-1.5 w-8 rounded-full bg-[#333]" />
            <div className="h-1.5 w-16 rounded-full bg-[#333]" />
            <div className="h-1.5 w-12 rounded-full bg-[#333]" />
          </div>
        </div>
      </div>
    ),
  },
];

export function SettingsAppearance() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {themeOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setTheme(option.id)}
            className={`group relative flex flex-col gap-3 rounded-xl border-2 p-2 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
              theme === option.id
                ? "border-[var(--accent-blue-primary)]"
                : "border-transparent bg-[var(--bg-field)] hover:bg-[var(--bg-field-hover)]"
            }`}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-[var(--border-secondary)] shadow-sm transition-all group-hover:shadow-md">
              {option.preview}
            </div>
            <div className="px-1 pb-1 flex items-center justify-between">
              <span
                className={`block text-sm font-semibold transition-colors ${
                  theme === option.id
                    ? "text-[var(--accent-blue-primary)]"
                    : "text-[var(--text-primary)]"
                }`}
              >
                {option.label}
              </span>
              {theme === option.id && (
                <IconCircleCheckFilled className="h-4 w-4 text-[var(--accent-blue-primary)]" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
