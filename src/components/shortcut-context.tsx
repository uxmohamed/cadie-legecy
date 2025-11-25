"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

interface Shortcut {
  key: string;
  description: string;
  category: "Global" | "Navigation" | "Actions";
  action: () => void;
}

interface ShortcutContextType {
  registerShortcut: (shortcut: Shortcut) => void;
  unregisterShortcut: (key: string) => void;
  isHelpOpen: boolean;
  toggleHelp: () => void;
  shortcuts: Shortcut[];
}

const ShortcutContext = React.createContext<ShortcutContextType | undefined>(
  undefined
);

export function useShortcuts() {
  const context = React.useContext(ShortcutContext);
  if (!context) {
    throw new Error("useShortcuts must be used within a ShortcutProvider");
  }
  return context;
}

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = React.useState<Shortcut[]>([]);
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const router = useRouter();

  const registerShortcut = React.useCallback((shortcut: Shortcut) => {
    setShortcuts((prev) => {
      // Avoid duplicates
      if (prev.some((s) => s.key === shortcut.key)) return prev;
      return [...prev, shortcut];
    });
  }, []);

  const unregisterShortcut = React.useCallback((key: string) => {
    setShortcuts((prev) => prev.filter((s) => s.key !== key));
  }, []);

  const toggleHelp = React.useCallback(() => {
    setIsHelpOpen((prev) => !prev);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input is focused, unless it's a special shortcut like Escape or Ctrl/Cmd combos
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Always allow toggling help with ? (Shift + /)
      if (e.key === "?" && !isInputFocused) {
        e.preventDefault();
        toggleHelp();
        return;
      }
      
      // Close help with Escape
      if (isHelpOpen && e.key === "Escape") {
        e.preventDefault();
        setIsHelpOpen(false);
        return;
      }

      // Don't trigger other shortcuts if help is open
      if (isHelpOpen) return;

      const matchedShortcut = shortcuts.find((s) => s.key === e.key);

      if (matchedShortcut) {
        // If input is focused, only allow shortcuts that use modifier keys or specific exceptions
        // For now, we'll be conservative: if input is focused, block single-key shortcuts
        if (isInputFocused && !e.metaKey && !e.ctrlKey && !e.altKey) {
          return;
        }
        
        e.preventDefault();
        matchedShortcut.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, isHelpOpen, toggleHelp]);

  // Register default global shortcuts
  React.useEffect(() => {
    const globalShortcuts: Shortcut[] = [
      {
        key: "?",
        description: "Toggle keyboard shortcuts help",
        category: "Global",
        action: toggleHelp,
      },
      {
        key: "Cmd+/",
        description: "Toggle keyboard shortcuts help",
        category: "Global",
        action: toggleHelp,
      },
      {
        key: "H", // Shift+h
        description: "Go to Home",
        category: "Navigation",
        action: () => router.push("/"),
      },
    ];

    globalShortcuts.forEach(registerShortcut);

    return () => {
      globalShortcuts.forEach((s) => unregisterShortcut(s.key));
    };
  }, [toggleHelp, router, registerShortcut, unregisterShortcut]);

  return (
    <ShortcutContext.Provider
      value={{
        registerShortcut,
        unregisterShortcut,
        isHelpOpen,
        toggleHelp,
        shortcuts,
      }}
    >
      {children}
    </ShortcutContext.Provider>
  );
}
