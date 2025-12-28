"use client";

import * as React from "react";
import { useTheme } from "@/components/theme-provider";
import { Label } from "@/components/ui/label";
import { IconCheck } from "@tabler/icons-react";

const themeOptions = [
  {
    id: "system" as const,
    label: "System",
    description: "Match system settings",
    preview: (
      <div className="relative h-full w-full flex">
        {/* Light half */}
        <div className="w-1/2 bg-[#F5F5F5] relative">
          <div className="absolute inset-1 right-0 rounded-l bg-white border-l border-t border-b border-gray-100">
            <div className="space-y-1 p-1.5">
              <div className="h-1.5 w-6 rounded-full bg-gray-200" />
              <div className="h-1.5 w-8 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
        {/* Dark half */}
        <div className="w-1/2 bg-[#111] relative">
          <div className="absolute inset-1 left-0 rounded-r bg-[#1C1C1C] border-r border-t border-b border-[#333]">
            <div className="space-y-1 p-1.5">
              <div className="h-1.5 w-6 rounded-full bg-[#333]" />
              <div className="h-1.5 w-8 rounded-full bg-[#333]" />
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
            <div className="h-1.5 w-12 rounded-full bg-gray-100" />
            <div className="h-1.5 w-16 rounded-full bg-blue-50" />
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
        <div className="absolute inset-2 rounded bg-[#1C1C1C] shadow-sm border border-[#333]">
          <div className="space-y-1.5 p-2">
            <div className="h-1.5 w-8 rounded-full bg-[#333]" />
            <div className="h-1.5 w-12 rounded-full bg-[#333]" />
            <div className="h-1.5 w-16 rounded-full bg-blue-900/40" />
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
            <div className="px-1 pb-1">
              <span
                className={`block text-sm font-semibold transition-colors ${
                  theme === option.id
                    ? "text-[var(--accent-blue-primary)]"
                    : "text-[var(--text-primary)]"
                }`}
              >
                {option.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
