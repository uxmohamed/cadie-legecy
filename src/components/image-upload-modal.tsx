"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconUpload, IconPhoto, IconX, IconLoader2, IconAlertTriangle } from "@tabler/icons-react";
import { toast } from "sonner";

interface ImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadFiles: (files: File[]) => void;
  isUploading?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 1;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function ImageUploadModal({
  open,
  onOpenChange,
  onUploadFiles,
  isUploading = false,
}: ImageUploadModalProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [previewFiles, setPreviewFiles] = React.useState<{ file: File; preview: string; error?: string }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validFiles = previewFiles.filter((f) => !f.error);
  const hasErrors = previewFiles.some((f) => f.error);

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      previewFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [previewFiles]);

  // Reset when modal closes
  React.useEffect(() => {
    if (!open) {
      previewFiles.forEach((f) => URL.revokeObjectURL(f.preview));
      setPreviewFiles([]);
      setDragOver(false);
    }
  }, [open]);

  const addFiles = React.useCallback((files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;

    setPreviewFiles((prev) => {
      // Revoke old preview
      prev.forEach((f) => URL.revokeObjectURL(f.preview));

      let error: string | undefined;
      if (!ACCEPTED_TYPES.includes(file.type)) {
        error = "Unsupported format";
      } else if (file.size > MAX_FILE_SIZE) {
        error = `Too large (${formatSize(file.size)})`;
      }
      return [{ file, preview: URL.createObjectURL(file), error }];
    });
  }, []);

  const removeFile = React.useCallback((index: number) => {
    setPreviewFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileSelect = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      e.target.value = "";
    },
    [addFiles]
  );

  const handleUpload = React.useCallback(() => {
    if (validFiles.length === 0) return;
    onUploadFiles(validFiles.map((f) => f.file));
    onOpenChange(false);
  }, [validFiles, onUploadFiles, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Images</DialogTitle>
        </DialogHeader>

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border-muted hover:border-border-hover"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-muted">
            <IconUpload className="h-6 w-6 text-fg-subtle" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-fg">
              Drop images here or click to browse
            </p>
            <p className="text-xs text-fg-subtle mt-1">
              JPEG, PNG, GIF, WebP, SVG, AVIF &middot; Max 5MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Preview thumbnails */}
        {previewFiles.length > 0 && previewFiles[0] && (
          <div className="mt-2">
            <div
              className={`relative group rounded-xl overflow-hidden border ${
                previewFiles[0].error ? "border-destructive/50" : "border-border-muted"
              }`}
            >
              <img
                src={previewFiles[0].preview}
                alt={previewFiles[0].file.name}
                className={`w-full max-h-48 object-cover ${previewFiles[0].error ? "opacity-40" : ""}`}
              />
              {previewFiles[0].error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-1.5 bg-destructive/80 text-white px-3 py-1.5 rounded-lg">
                    <IconAlertTriangle className="h-4 w-4" />
                    <span className="text-xs font-medium">{previewFiles[0].error}</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(0);
                }}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-fg-subtle truncate max-w-[70%]">{previewFiles[0].file.name}</span>
              <span className="text-xs text-fg-subtle">{formatSize(previewFiles[0].file.size)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={validFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <IconLoader2 className="h-4 w-4 animate-spin mr-1.5" />
                Uploading...
              </>
            ) : (
              <>
                <IconPhoto className="h-4 w-4 mr-1.5" />
                Upload
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
