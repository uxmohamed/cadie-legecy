"use client";

import * as React from "react";
import { useShortcuts } from "./shortcut-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

export function ShortcutsHelpModal() {
  const { isHelpOpen, toggleHelp, shortcuts } = useShortcuts();

  // Group shortcuts by category
  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<string, typeof shortcuts> = {};
    shortcuts.forEach((s) => {
      if (!groups[s.category]) {
        groups[s.category] = [];
      }
      groups[s.category].push(s);
    });
    return groups;
  }, [shortcuts]);

  // Format keyboard shortcut key for display
  const formatKey = (key: string): string[] => {
    // Map modifier keys to symbols
    const modifierSymbols: Record<string, string> = {
      "cmd": "⌘",
      "command": "⌘",
      "ctrl": "⌃",
      "control": "⌃",
      "alt": "⌥",
      "option": "⌥",
      "shift": "⇧",
    };
    
    // Handle modifier key combinations (Cmd+/ -> ⌘, /)
    if (key.includes("+")) {
      const parts = key.split(/\+/);
      return parts.map((p) => {
        const normalized = p.toLowerCase();
        if (modifierSymbols[normalized]) {
          return modifierSymbols[normalized];
        }
        return p.toUpperCase();
      });
    }
    
    // Handle special keys
    const specialKeys: Record<string, string> = {
      "Enter": "ENTER",
      "Backspace": "BACKSPACE",
      "Escape": "ESC",
      "Space": "SPACE",
      "ArrowUp": "↑",
      "ArrowDown": "↓",
      "ArrowLeft": "←",
      "ArrowRight": "→",
    };
    
    if (specialKeys[key]) {
      return [specialKeys[key]];
    }
    
    // Single character keys - uppercase
    if (key.length === 1) {
      return [key.toUpperCase()];
    }
    
    // Check if the key itself is a modifier
    const normalizedKey = key.toLowerCase();
    if (modifierSymbols[normalizedKey]) {
      return [modifierSymbols[normalizedKey]];
    }
    
    // Default: uppercase and split by spaces if needed
    return key.split(" ").map((k) => {
      const normalized = k.toLowerCase();
      return modifierSymbols[normalized] || k.toUpperCase();
    });
  };

  return (
    <Dialog open={isHelpOpen} onOpenChange={toggleHelp}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-semibold text-fg mb-3">{category}</h3>
              <div className="space-y-2">
                {items.map((shortcut) => {
                  const formattedKeys = formatKey(shortcut.key);
                  return (
                    <div
                      key={shortcut.key + shortcut.description}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-fg-muted">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {formattedKeys.map((k, index) => (
                          <Kbd
                            key={`${k}-${index}`}
                            className="pointer-events-none h-5 px-1.5 text-[10px] uppercase bg-bg-surface text-fg-subtle"
                          >
                            {k}
                          </Kbd>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
