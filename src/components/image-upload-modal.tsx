"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconUpload, IconPhoto, IconX, IconLoader2 } from "@tabler/icons-react";

interface ImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadFiles: (files: File[]) => void;
  isUploading?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ImageUploadModal({
  open,
  onOpenChange,
  onUploadFiles,
  isUploading = false,
}: ImageUploadModalProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [previewFiles, setPreviewFiles] = React.useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    const validFiles: { file: File; preview: string }[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      validFiles.push({ file, preview: URL.createObjectURL(file) });
    }
    setPreviewFiles((prev) => [...prev, ...validFiles]);
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
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [addFiles]
  );

  const handleUpload = React.useCallback(() => {
    if (previewFiles.length === 0) return;
    onUploadFiles(previewFiles.map((f) => f.file));
    onOpenChange(false);
  }, [previewFiles, onUploadFiles, onOpenChange]);

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
              JPEG, PNG, GIF, WebP, SVG, AVIF. Max 5MB each.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Preview thumbnails */}
        {previewFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {previewFiles.map((item, i) => (
              <div key={i} className="relative group h-16 w-16 rounded-lg overflow-hidden border border-border-muted">
                <img
                  src={item.preview}
                  alt={item.file.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <IconX className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={previewFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <IconLoader2 className="h-4 w-4 animate-spin mr-1.5" />
                Uploading...
              </>
            ) : (
              <>
                <IconPhoto className="h-4 w-4 mr-1.5" />
                Upload {previewFiles.length > 0 ? `(${previewFiles.length})` : ""}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
