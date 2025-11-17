"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { detectContentType } from "@/lib/content-detector";

interface CaptureInputProps {
  onSubmit: (value: string, type: "url" | "color" | "text") => void;
  isLoading?: boolean;
}

export function CaptureInput({ onSubmit, isLoading }: CaptureInputProps) {
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;

    const detected = detectContentType(value);
    onSubmit(detected.value, detected.type);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setValue("");
      inputRef.current?.blur();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="+ Insert a link, color, or just plain text..."
          disabled={isLoading}
          className="w-full pr-16"
          aria-label="Capture input"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <kbd className="pointer-events-none flex h-6 select-none items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-2 font-mono text-[11px] font-medium text-neutral-400">
            <span className="text-xs">⌘</span>F
          </kbd>
        </div>
      </div>
    </form>
  );
}

