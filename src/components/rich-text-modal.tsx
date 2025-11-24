"use client";

import * as React from "react";
import type { SerializedEditorState } from "lexical";
import { X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "./ui/dialog";
import { RichTextEditor } from "./rich-text-editor";
import { Button } from "./ui/button";

interface RichTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: SerializedEditorState) => Promise<void>;
  initialContent?: SerializedEditorState | null;
  linkId: string;
}

export function RichTextModal({
  isOpen,
  onClose,
  onSave,
  initialContent,
  linkId,
}: RichTextModalProps) {
  const [content, setContent] = React.useState<SerializedEditorState | null>(
    initialContent || null
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const initialContentRef = React.useRef<SerializedEditorState | null>(null);
  const hasChangedRef = React.useRef(false);

  React.useEffect(() => {
    if (isOpen) {
      setContent(initialContent || null);
      initialContentRef.current = initialContent || null;
      hasChangedRef.current = false;
      setSaveStatus("idle");
    }
  }, [isOpen, initialContent]);

  // Debounced auto-save
  React.useEffect(() => {
    if (!content || !isOpen) return;

    // Check if content has actually changed from initial
    const contentChanged = JSON.stringify(content) !== JSON.stringify(initialContentRef.current);
    
    if (!contentChanged && !hasChangedRef.current) {
      return; // Don't save if nothing has changed
    }

    hasChangedRef.current = true;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    setSaveStatus("idle");
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      setIsSaving(true);
      try {
        await onSave(content);
        initialContentRef.current = content; // Update initial content after successful save
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000); // Show "saved" for 2 seconds
      } catch (error) {
        console.error("Error auto-saving rich text:", error);
        setSaveStatus("idle");
      } finally {
        setIsSaving(false);
      }
    }, 2000); // 2 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, onSave, isOpen]);

  const handleClose = () => {
    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        <DialogClose
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent text-neutral-500 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-900 pointer-events-auto"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </DialogClose>

        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <DialogTitle>Edit Rich Text</DialogTitle>
          <div className="text-sm text-neutral-500">
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "✓ Saved"}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <RichTextEditor
            value={content || undefined}
            onChange={setContent}
            className="min-h-[400px]"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

