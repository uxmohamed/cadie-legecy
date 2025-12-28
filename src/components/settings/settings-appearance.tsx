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
      <div className="relative h-full w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
        <div className="absolute inset-2 rounded bg-white shadow-sm dark:bg-slate-950">
          <div className="space-y-1.5 p-2 opacity-50">
            <div className="h-1.5 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
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
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">Appearance</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Customize how Cadie looks on your device.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {themeOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setTheme(option.id)}
            className={`group relative flex flex-col gap-3 rounded-xl border p-2 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
              theme === option.id
                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5"
                : "border-[var(--border-primary)] bg-[var(--bg-field)] hover:border-[var(--border-secondary)] hover:bg-[var(--bg-field-hover)]"
            }`}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-[var(--border-secondary)] shadow-sm transition-all group-hover:shadow-md">
              {option.preview}
              {theme === option.id && (
                <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white shadow-md animate-in zoom-in spin-in-12 duration-300">
                  <IconCheck className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              )}
            </div>
            <div className="px-1 pb-1">
              <span
                className={`block text-sm font-semibold transition-colors ${
                  theme === option.id
                    ? "text-[var(--brand-primary)]"
                    : "text-[var(--text-primary)]"
                }`}
              >
                {option.label}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {option.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
