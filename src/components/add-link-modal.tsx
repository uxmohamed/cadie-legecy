"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CaptureInput } from "@/components/capture-input";
import type { DetectedContent } from "@/lib/content-detector";
import { useShortcuts } from "@/components/shortcut-context";

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (items: DetectedContent[]) => void;
  isLoading?: boolean;
}

export function AddLinkModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: AddLinkModalProps) {
  const { registerShortcut, unregisterShortcut } = useShortcuts();

  // Register keyboard shortcuts to open modal
  React.useEffect(() => {
    registerShortcut({
      key: "a",
      description: "Add new item",
      category: "Global",
      action: () => {
        if (!isOpen) {
          // Only open if not already open
          const event = new CustomEvent("openAddModal");
          window.dispatchEvent(event);
        }
      },
    });

    registerShortcut({
      key: "/",
      description: "Search / Add",
      category: "Global",
      action: () => {
        if (!isOpen) {
          const event = new CustomEvent("openAddModal");
          window.dispatchEvent(event);
        }
      },
    });

    return () => {
      unregisterShortcut("a");
      unregisterShortcut("/");
    };
  }, [registerShortcut, unregisterShortcut, isOpen]);

  const handleSubmit = (items: DetectedContent[]) => {
    onSubmit(items);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add to Cadie</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <CaptureInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            autoFocus
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
