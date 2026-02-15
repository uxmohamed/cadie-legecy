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
