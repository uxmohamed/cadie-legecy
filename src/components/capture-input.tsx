"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { detectMultipleContentTypes, type DetectedContent } from "@/lib/content-detector";

interface CaptureInputProps {
  onSubmit: (items: DetectedContent[]) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
}

export function CaptureInput({ onSubmit, onSearch, isLoading }: CaptureInputProps) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSearch?.(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;

    const detectedItems = detectMultipleContentTypes(value);
    setValue("");
    onSearch?.("");
    onSubmit(detectedItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setValue("");
      onSearch?.("");
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
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="+ Insert a link, color, or just plain text..."
          disabled={isLoading}
          className="w-full pr-16 text-lg py-2.5"
          aria-label="Capture input"
          size="lg"
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

