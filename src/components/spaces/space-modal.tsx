"use client";

import * as React from "react";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ColorPicker, SPACE_COLORS, type SpaceColor } from "./color-picker";
import type { Space } from "@/types";
import { IconTrash } from "@tabler/icons-react";

interface SpaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space?: Space | null;
  onSave: (name: string, color: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function SpaceModal({
  open,
  onOpenChange,
  space,
  onSave,
  onDelete,
}: SpaceModalProps) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(SPACE_COLORS.blue.cssVar);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isEditing = !!space;

  // Reset form when modal opens/closes or space changes
  React.useEffect(() => {
    if (open) {
      if (space) {
        setName(space.name);
        setColor(space.color);
      } else {
        setName("");
        setColor(SPACE_COLORS.blue.cssVar);
      }
    }
  }, [open, space]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave(name.trim(), color);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving space:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!space || !onDelete) return;

    if (!confirm(`Are you sure you want to delete "${space.name}"? This will remove all links from this space.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(space.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting space:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Space" : "New Space"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label
              htmlFor="space-name"
              className="text-sm font-[470] text-fg"
            >
              Name
            </label>
            <Input
              id="space-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter space name"
              autoFocus
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-[470] text-fg">
              Color
            </label>
            <ColorPicker selectedColor={color} onColorSelect={setColor} />
          </div>
        </div>

        <DialogFooter>
          {isEditing && onDelete && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="mr-auto text-destructive hover:text-destructive hover:bg-destructive-muted"
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving || isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isSaving || isDeleting}
          >
            {isSaving ? "Saving..." : isEditing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
