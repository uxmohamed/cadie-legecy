"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  detectMultipleContentTypes,
  type DetectedContent,
} from "@/lib/content-detector";
import { useShortcuts } from "@/components/shortcut-context";

interface CaptureInputProps {
  onSubmit?: (items: DetectedContent[]) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  autoFocus?: boolean;
  searchOnly?: boolean;
  onFocusRequest?: (focusFn: () => void) => void;
}

export function CaptureInput({
  onSubmit,
  onSearch,
  isLoading,
  autoFocus = false,
  searchOnly = false,
  onFocusRequest,
}: CaptureInputProps) {
  const [value, setValue] = React.useState("");
  const [showFocusAnimation, setShowFocusAnimation] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { registerShortcut, unregisterShortcut } = useShortcuts();

  const focusInput = React.useCallback(() => {
    inputRef.current?.focus();
    setShowFocusAnimation(true);
    setTimeout(() => setShowFocusAnimation(false), 200);
  }, []);

  // Expose focus function to parent via callback
  React.useEffect(() => {
    if (onFocusRequest) {
      onFocusRequest(focusInput);
    }
  }, [onFocusRequest, focusInput]);

  React.useEffect(() => {

    registerShortcut({
      key: "a",
      description: "Focus capture input",
      category: "Global",
      action: () => {
        focusInput();
      },
    });

    registerShortcut({
      key: "/",
      description: "Search / Capture",
      category: "Global",
      action: () => {
        focusInput();
      },
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        focusInput();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unregisterShortcut("a");
      unregisterShortcut("/");
    };
  }, [registerShortcut, unregisterShortcut]);

  // Auto-focus input when autoFocus is true
  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSearch?.(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchOnly || !value.trim() || isLoading || !onSubmit) return;

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

  const placeholder = searchOnly
    ? "Search your links..."
    : "+ Insert a link or color...";

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="w-full">

      <div
        className={`relative transition-shadow duration-300 rounded-lg ${
          showFocusAnimation
            ? "shadow-[0_0_40px_8px_rgba(0,0,0,0.2),0_0_20px_4px_rgba(0,0,0,0.15)]"
            : ""
        }`}
      >
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full pr-16 text-lg py-2.5"
          aria-label="Capture input"
          size="lg"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <kbd className="pointer-events-none flex h-6 select-none items-center gap-1 rounded border border-[var(--border-primary)] bg-[var(--bg-l1-solid)] px-2 font-mono text-[11px] font-medium text-[var(--text-tertiary)]">
            <span className="text-xs">⌘</span>F
          </kbd>
        </div>
      </div>
    </form>
  );
}

CaptureInput.displayName = "CaptureInput";
