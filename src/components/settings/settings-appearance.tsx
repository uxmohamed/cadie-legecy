"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/components/theme-provider";
import { IconSun, IconMoon, IconDeviceDesktop } from "@tabler/icons-react";

export function SettingsAppearance() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Theme</Label>
          <p className="text-sm text-[var(--text-secondary)]">
            Select your preferred color scheme
          </p>
        </div>

        <RadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
          className="grid gap-3"
        >
          {/* Light Mode */}
          <label
            htmlFor="theme-light"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-primary)] p-4 transition-colors hover:bg-[var(--bg-field-hover)] has-[[data-state=checked]]:border-[var(--border-active)] has-[[data-state=checked]]:bg-[var(--bg-field)]"
          >
            <RadioGroupItem value="light" id="theme-light" />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-field)]">
              <IconSun className="h-5 w-5 text-[var(--icon-secondary)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Light</p>
              <p className="text-xs text-[var(--text-secondary)]">
                A bright, clean appearance
              </p>
            </div>
          </label>

          {/* Dark Mode */}
          <label
            htmlFor="theme-dark"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-primary)] p-4 transition-colors hover:bg-[var(--bg-field-hover)] has-[[data-state=checked]]:border-[var(--border-active)] has-[[data-state=checked]]:bg-[var(--bg-field)]"
          >
            <RadioGroupItem value="dark" id="theme-dark" />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-field)]">
              <IconMoon className="h-5 w-5 text-[var(--icon-secondary)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Dark</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Easy on the eyes in low light
              </p>
            </div>
          </label>

          {/* System Mode */}
          <label
            htmlFor="theme-system"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-primary)] p-4 transition-colors hover:bg-[var(--bg-field-hover)] has-[[data-state=checked]]:border-[var(--border-active)] has-[[data-state=checked]]:bg-[var(--bg-field)]"
          >
            <RadioGroupItem value="system" id="theme-system" />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-field)]">
              <IconDeviceDesktop className="h-5 w-5 text-[var(--icon-secondary)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">System</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Automatically match your device settings
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>
    </div>
  );
}
