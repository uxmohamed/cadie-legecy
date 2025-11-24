"use client";

import * as React from "react";
import { useShortcuts } from "./shortcut-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  return (
    <Dialog open={isHelpOpen} onOpenChange={toggleHelp}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-semibold text-neutral-900 mb-3">{category}</h3>
              <div className="space-y-2">
                {items.map((shortcut) => (
                  <div
                    key={shortcut.key + shortcut.description}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-neutral-500">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.key.split(" ").map((k) => (
                        <kbd
                          key={k}
                          className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-1.5 font-mono text-[10px] font-medium text-neutral-500 uppercase"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
