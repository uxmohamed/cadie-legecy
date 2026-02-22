"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "./theme-provider";

export type ShortcutCategory = "Global" | "Navigation" | "Actions";

interface Shortcut {
  key: string;
  description: string;
  category: ShortcutCategory;
  action: () => void;
  allowInInput?: boolean;
  priority?: number;
}

interface ShortcutRecord extends Shortcut {
  id: string;
  normalizedKey: string;
  order: number;
}

interface ShortcutContextType {
  registerShortcut: (shortcut: Shortcut) => string;
  unregisterShortcut: (id: string) => void;
  isHelpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  toggleHelp: () => void;
  shortcuts: Array<Pick<Shortcut, "key" | "description" | "category">>;
}

const ShortcutContext = React.createContext<ShortcutContextType | undefined>(
  undefined
);

const MODIFIER_ORDER = ["Cmd", "Ctrl", "Alt", "Shift"] as const;

function normalizeKeyToken(token: string): string {
  const value = token.trim();
  const lower = value.toLowerCase();

  const tokenMap: Record<string, string> = {
    cmd: "Cmd",
    command: "Cmd",
    meta: "Cmd",
    ctrl: "Ctrl",
    control: "Ctrl",
    alt: "Alt",
    option: "Alt",
    shift: "Shift",
    esc: "Escape",
    return: "Enter",
    spacebar: "Space",
    " ": "Space",
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
  };

  if (tokenMap[lower]) {
    return tokenMap[lower];
  }

  if (value.length === 1) {
    return /[A-Z]/i.test(value) ? value.toLowerCase() : value;
  }

  return value;
}

function normalizeShortcutKey(shortcutKey: string): string {
  const rawParts = shortcutKey
    .split("+")
    .map((part) => normalizeKeyToken(part))
    .filter(Boolean);

  const modifierSet = new Set(MODIFIER_ORDER);
  const modifiers = MODIFIER_ORDER.filter((modifier) => rawParts.includes(modifier));
  const keyPart = rawParts.find((part) => !modifierSet.has(part as (typeof MODIFIER_ORDER)[number]));

  return [...modifiers, keyPart].filter(Boolean).join("+");
}

function getEventKey(event: KeyboardEvent): string {
  const key = event.key;

  if (key === " ") return "Space";
  if (key === "Esc") return "Escape";

  if (key.length === 1) {
    if (/[A-Z]/i.test(key)) {
      return key.toLowerCase();
    }
    return key;
  }

  return normalizeKeyToken(key);
}

function getEventCombo(event: KeyboardEvent): string {
  const key = getEventKey(event);
  const modifiers: string[] = [];

  if (event.metaKey) modifiers.push("Cmd");
  if (event.ctrlKey) modifiers.push("Ctrl");
  if (event.altKey) modifiers.push("Alt");

  // Preserve explicit Shift shortcuts for letters and named keys.
  const shouldIncludeShift =
    event.shiftKey &&
    (key.length > 1 || /^[a-z]$/.test(key));

  if (shouldIncludeShift) modifiers.push("Shift");

  return [...modifiers, key].join("+");
}

export function useShortcuts() {
  const context = React.useContext(ShortcutContext);
  if (!context) {
    throw new Error("useShortcuts must be used within a ShortcutProvider");
  }
  return context;
}

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const [shortcutRecords, setShortcutRecords] = React.useState<ShortcutRecord[]>([]);
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const sequenceRef = React.useRef(0);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const registerShortcut = React.useCallback((shortcut: Shortcut) => {
    const id = `shortcut_${sequenceRef.current++}`;
    const normalizedKey = normalizeShortcutKey(shortcut.key);

    setShortcutRecords((prev) => [
      ...prev,
      {
        ...shortcut,
        id,
        normalizedKey,
        order: sequenceRef.current,
      },
    ]);

    return id;
  }, []);

  const unregisterShortcut = React.useCallback((id: string) => {
    setShortcutRecords((prev) => prev.filter((shortcut) => shortcut.id !== id));
  }, []);

  const toggleHelp = React.useCallback(() => {
    setIsHelpOpen((prev) => !prev);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      const isInCommandInput =
        target instanceof Element &&
        target.closest("[data-command-input='true']") !== null;

      const combo = getEventCombo(event);
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey;

      // Never let single-key shortcuts consume command input typing.
      if (isInCommandInput && combo !== "Escape" && !hasModifier) {
        return;
      }

      if (isHelpOpen && combo === "Escape") {
        event.preventDefault();
        setIsHelpOpen(false);
        return;
      }

      const candidates = shortcutRecords
        .filter((shortcut) => shortcut.normalizedKey === combo)
        .filter((shortcut) => !isInputFocused || shortcut.allowInInput)
        .sort((a, b) => {
          const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
          if (priorityDiff !== 0) return priorityDiff;
          return b.order - a.order;
        });

      const matchedShortcut = candidates[0];
      if (!matchedShortcut) return;

      // Allow Escape when modal/help is open, block all other shortcuts behind help modal.
      if (isHelpOpen && combo !== "Escape") return;

      event.preventDefault();
      matchedShortcut.action();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcutRecords, isHelpOpen]);

  React.useEffect(() => {
    const globalShortcutIds = [
      registerShortcut({
        key: "?",
        description: "Toggle keyboard shortcuts help",
        category: "Global",
        action: toggleHelp,
      }),
      registerShortcut({
        key: "Cmd+/",
        description: "Toggle keyboard shortcuts help",
        category: "Global",
        action: toggleHelp,
      }),
      registerShortcut({
        key: "Ctrl+/",
        description: "Toggle keyboard shortcuts help",
        category: "Global",
        action: toggleHelp,
      }),
      registerShortcut({
        key: "Shift+h",
        description: "Go to Home",
        category: "Navigation",
        action: () => router.push("/"),
      }),
      registerShortcut({
        key: "m",
        description: "Toggle dark/light mode",
        category: "Global",
        action: toggleTheme,
      }),
    ];

    return () => {
      globalShortcutIds.forEach(unregisterShortcut);
    };
  }, [toggleHelp, toggleTheme, router, registerShortcut, unregisterShortcut]);

  const shortcuts = React.useMemo(
    () =>
      shortcutRecords.map(({ key, description, category }) => ({
        key,
        description,
        category,
      })),
    [shortcutRecords]
  );

  return (
    <ShortcutContext.Provider
      value={{
        registerShortcut,
        unregisterShortcut,
        isHelpOpen,
        setHelpOpen: setIsHelpOpen,
        toggleHelp,
        shortcuts,
      }}
    >
      {children}
    </ShortcutContext.Provider>
  );
}
