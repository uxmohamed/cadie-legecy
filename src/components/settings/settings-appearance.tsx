"use client";

import * as React from "react";
import { useTheme } from "@/components/theme-provider";
import { ThemePreview } from "@/components/theme-preview";

const themeOptions = [
  { id: "system" as const, label: "System" },
  { id: "light" as const, label: "Light" },
  { id: "dark" as const, label: "Dark" },
];

export function SettingsAppearance() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {themeOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setTheme(option.id)}
            className="group relative flex flex-col gap-3 rounded-xl p-2 text-left transition-all outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-lg border-2 transition-all group-hover:brightness-[0.97] dark:group-hover:brightness-110 ${
              theme === option.id
                ? "border-accent"
                : "border-border-muted"
            }`}>
              <ThemePreview variant={option.id} isSelected={theme === option.id} />
            </div>
            <div className="px-1 pb-1">
              <span className="block text-sm font-medium text-fg">
                {option.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
