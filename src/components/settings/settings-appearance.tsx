"use client";

import * as React from "react";
import { useTheme } from "@/components/theme-provider";

const themeOptions = [
  {
    id: "system" as const,
    label: "System",
    preview: (
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-orange-200 via-purple-300 to-blue-400">
        {/* Dark document */}
        <div className="absolute left-2 top-4 w-[45%] h-[70%] bg-gray-800 rounded-md transform -rotate-6 shadow-lg">
          <div className="p-2 space-y-1.5">
            <div className="h-1 w-8 bg-gray-600 rounded" />
            <div className="h-1 w-12 bg-gray-600 rounded" />
            <div className="h-1 w-10 bg-gray-600 rounded" />
            <div className="h-1 w-8 bg-gray-600 rounded" />
          </div>
        </div>
        {/* Light document */}
        <div className="absolute right-2 top-6 w-[45%] h-[70%] bg-white rounded-md transform rotate-6 shadow-lg">
          <div className="p-2 space-y-1.5">
            <div className="h-1 w-8 bg-gray-200 rounded" />
            <div className="h-1 w-12 bg-gray-200 rounded" />
            <div className="h-1 w-10 bg-gray-200 rounded" />
            <div className="h-1 w-8 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "light" as const,
    label: "Light",
    preview: (
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-pink-200 via-purple-200 to-blue-300">
        {/* Light document back */}
        <div className="absolute left-4 top-4 w-[50%] h-[75%] bg-white/80 rounded-md transform -rotate-6 shadow-lg">
          <div className="p-2 space-y-1.5">
            <div className="h-1 w-8 bg-gray-200 rounded" />
            <div className="h-1 w-12 bg-gray-200 rounded" />
            <div className="h-1 w-10 bg-gray-200 rounded" />
          </div>
        </div>
        {/* Light document front */}
        <div className="absolute right-4 top-6 w-[50%] h-[75%] bg-white rounded-md transform rotate-3 shadow-lg">
          <div className="p-2 space-y-1.5">
            <div className="h-1 w-8 bg-gray-200 rounded" />
            <div className="h-1 w-12 bg-gray-200 rounded" />
            <div className="h-1 w-10 bg-gray-200 rounded" />
            <div className="h-1 w-8 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "dark" as const,
    label: "Dark",
    preview: (
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-purple-400 via-purple-600 to-blue-700">
        {/* Dark document back */}
        <div className="absolute left-4 top-4 w-[50%] h-[75%] bg-gray-800 rounded-md transform -rotate-6 shadow-lg">
          <div className="p-2 space-y-1.5">
            <div className="h-1 w-8 bg-gray-600 rounded" />
            <div className="h-1 w-12 bg-gray-600 rounded" />
            <div className="h-1 w-10 bg-gray-600 rounded" />
          </div>
        </div>
        {/* Dark document front */}
        <div className="absolute right-4 top-6 w-[50%] h-[75%] bg-gray-900 rounded-md transform rotate-3 shadow-lg">
          <div className="p-2 space-y-1.5">
            <div className="h-1 w-8 bg-gray-700 rounded" />
            <div className="h-1 w-12 bg-gray-700 rounded" />
            <div className="h-1 w-10 bg-gray-700 rounded" />
            <div className="h-1 w-8 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    ),
  },
];

export function SettingsAppearance() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[var(--bg-field)] p-4">
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setTheme(option.id)}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className={`w-full rounded-lg overflow-hidden transition-all ${
                  theme === option.id
                    ? "ring-2 ring-[var(--brand-primary)] ring-offset-2 ring-offset-[var(--bg-field)]"
                    : "hover:opacity-80"
                }`}
              >
                {option.preview}
              </div>
              <span
                className={`text-sm font-medium transition-colors ${
                  theme === option.id
                    ? "text-[var(--brand-primary)]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
