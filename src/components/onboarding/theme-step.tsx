"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { useTheme } from "@/components/theme-provider";
import { ThemePreview } from "@/components/theme-preview";

interface ThemeStepProps {
  onComplete: () => void;
  isLoading?: boolean;
}

export function ThemeStep({ onComplete, isLoading = false }: ThemeStepProps) {
  const { theme, setTheme } = useTheme();

  // Handle theme selection
  // Note: We don't use 'system' here as requested by the user
  const setExactTheme = (t: 'light' | 'dark') => {
    setTheme(t);
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col gap-[12px] items-center w-full">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full mb-2 ${
          theme === 'dark' ? 'bg-bg-surface' : 'bg-bg-muted'
        }`}>
          {theme === 'dark' ? (
            <IconMoon className="h-6 w-6 text-fg" />
          ) : (
            <IconSun className="h-6 w-6 text-fg" />
          )}
        </div>
        <div className="flex flex-col gap-[2px] items-center w-full">
          <h1 className="text-[18px] font-semibold leading-[32px] text-fg text-center">
            Choose your theme
          </h1>
          <p className="text-[16px] font-medium leading-[32px] text-fg-muted text-center">
            You can change this anytime in settings.
          </p>
        </div>
      </div>

      {/* Theme Selection Cards */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {/* Light Mode Option */}
        <button
          onClick={() => setExactTheme('light')}
          className="group relative flex flex-col items-center gap-3 p-4 rounded-[16px] transition-all cursor-pointer"
        >
          <div className={`w-full aspect-[4/3] rounded-[8px] overflow-hidden border-2 transition-all group-hover:brightness-[0.97] ${
            theme === 'light'
              ? 'border-accent'
              : 'border-border-muted'
          }`}>
            <ThemePreview variant="light" isSelected={theme === 'light'} />
          </div>
          <span className="font-medium text-fg">Light</span>
        </button>

        {/* Dark Mode Option */}
        <button
          onClick={() => setExactTheme('dark')}
          className="group relative flex flex-col items-center gap-3 p-4 rounded-[16px] transition-all cursor-pointer"
        >
          <div className={`w-full aspect-[4/3] rounded-[8px] overflow-hidden border-2 transition-all group-hover:brightness-110 ${
            theme === 'dark'
              ? 'border-accent'
              : 'border-border-muted'
          }`}>
            <ThemePreview variant="dark" isSelected={theme === 'dark'} />
          </div>
          <span className="font-medium text-fg">Dark</span>
        </button>
      </div>

      {/* Continue Button */}
      <div className="flex flex-col gap-[12px] items-start w-full">
        <Button
          type="button"
          onClick={onComplete}
          variant="default"
          className="w-full p-3 rounded-[12px] text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg
                className="size-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="font-medium text-[14px] leading-[24px] text-white">
                Setting up...
              </span>
            </>
          ) : (
            <span className="font-medium text-[14px] leading-[24px] text-white">
              Continue
            </span>
          )}
        </Button>
      </div>
    </>
  );
}
