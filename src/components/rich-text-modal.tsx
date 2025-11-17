"use client";

import * as React from "react";
import type { SerializedEditorState } from "lexical";
import { X } from "lucide-react";
import { RichTextEditor } from "./rich-text-editor";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

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
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setContent(initialContent || null);
    }
  }, [isOpen, initialContent]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (!content) return;
    
    setIsSaving(true);
    try {
      await onSave(content);
      onClose();
    } catch (error) {
      console.error("Error saving rich text:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        className={cn(
          "relative w-full max-w-4xl max-h-[90vh] flex flex-col",
          "bg-white rounded-lg shadow-xl",
          "animate-in fade-in-0 zoom-in-95"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Edit Rich Text</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          <RichTextEditor
            value={content || undefined}
            onChange={setContent}
            className="min-h-[400px]"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !content}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

