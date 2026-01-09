"use client";

import * as React from "react";
import { useSpaces } from "@/features/spaces/queries/use-spaces-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  IconTrash, 
  IconPencil, 
  IconCheck, 
  IconX, 
  IconPlus, 
  IconCapsuleHorizontalFilled 
} from "@tabler/icons-react";
import { SPACE_COLORS, ColorPicker } from "@/components/spaces/color-picker";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Space } from "@/types";

interface SpaceItemProps {
  space: Space;
  onUpdate: (id: string, updates: { name?: string; color?: string }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

function SpaceItem({ space, onUpdate, onDelete }: SpaceItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(space.name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // Reset editName when space.name changes
  React.useEffect(() => {
    setEditName(space.name);
  }, [space.name]);

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    if (editName !== space.name) {
      await onUpdate(space.id, { name: editName });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(space.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleColorChange = async (newColor: string) => {
    if (newColor !== space.color) {
      await onUpdate(space.id, { color: newColor });
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-3 py-2 px-2 rounded-md bg-[var(--bg-field)]">
        <IconCapsuleHorizontalFilled 
          className="h-4 w-4 shrink-0" 
          style={{ color: space.color }}
        />

        <Input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveName}
          className="flex-1 h-8 bg-[var(--bg-field-default)] border-transparent shadow-none before:shadow-none focus:bg-[var(--bg-main)] focus:border-[var(--border-active)] px-2"
        />

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-field-hover)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--text-secondary)]"
            onClick={handleSaveName}
            disabled={editName.trim() === space.name || !editName.trim()}
          >
            <IconCheck className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-field-hover)]"
            onClick={handleCancel}
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 py-2 px-2 rounded-md hover:bg-[var(--bg-field-hover)] transition-colors w-full max-w-full overflow-hidden">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="h-6 w-6 flex items-center justify-center shrink-0 ring-2 ring-transparent hover:ring-[var(--border-hover)] transition-all cursor-pointer rounded-md"
            aria-label="Change color"
          >
            <IconCapsuleHorizontalFilled 
              className="h-4 w-4" 
              style={{ color: space.color }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <ColorPicker
            selectedColor={space.color}
            onColorSelect={handleColorChange}
            className="grid grid-cols-5 gap-2"
          />
        </PopoverContent>
      </Popover>
      <span className="flex-1 w-0 text-sm text-[var(--text-primary)] font-medium overflow-hidden text-ellipsis whitespace-nowrap">
        {space.name}
      </span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay-hover)]"
          onClick={() => setIsEditing(true)}
        >
          <IconPencil className="h-3.5 w-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-[var(--text-tertiary)] hover:text-[var(--text-destructive)] hover:bg-[var(--bg-overlay-destructive)]"
            >
              <IconTrash className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete space "<span className="inline-block max-w-[200px] truncate align-bottom">{space.name}</span>"?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All links in this space will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-[var(--accent-red-primary)] text-white hover:opacity-90 border-transparent"
                onClick={() => onDelete(space.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function SettingsSpaces() {
  const { spaces, createSpace, updateSpace, deleteSpace } = useSpaces(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newSpaceName, setNewSpaceName] = React.useState("");
  const [newSpaceColor, setNewSpaceColor] = React.useState(SPACE_COLORS.blue.cssVar);
  const createInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isCreating) {
      // Pick random color
      const colorKeys = Object.keys(SPACE_COLORS) as Array<keyof typeof SPACE_COLORS>;
      const randomColorKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
      setNewSpaceColor(SPACE_COLORS[randomColorKey].cssVar);
      setNewSpaceName("");
      
      // Focus input after render
      setTimeout(() => createInputRef.current?.focus(), 0);
    }
  }, [isCreating]);

  const handleCreate = async () => {
    if (!newSpaceName.trim()) return;
    await createSpace(newSpaceName, newSpaceColor);
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col gap-2 min-w-0 w-full overflow-hidden">
      <div className="flex flex-col gap-1 min-w-0 w-full overflow-hidden">
        {spaces.map((space) => (
          <SpaceItem
            key={space.id}
            space={space}
            onUpdate={updateSpace}
            onDelete={deleteSpace}
          />
        ))}

        {isCreating ? (
          <div className="flex items-center gap-3 py-2 px-2 rounded-md bg-[var(--bg-field)]">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-6 w-6 flex items-center justify-center shrink-0 ring-2 ring-transparent hover:ring-[var(--border-hover)] transition-all cursor-pointer rounded-md"
                  aria-label="Select color"
                >
                  <IconCapsuleHorizontalFilled 
                    className="h-4 w-4" 
                    style={{ color: newSpaceColor }}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <ColorPicker
                  selectedColor={newSpaceColor}
                  onColorSelect={setNewSpaceColor}
                  className="grid grid-cols-5 gap-2"
                />
              </PopoverContent>
            </Popover>

            <Input
              ref={createInputRef}
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setIsCreating(false);
              }}
              placeholder="Space name..."
              className="flex-1 h-8 bg-[var(--bg-field-default)] border-transparent shadow-none before:shadow-none focus:bg-[var(--bg-main)] focus:border-[var(--border-active)] px-2"
            />

            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-field-hover)]"
                onClick={handleCreate}
              >
                <IconCheck className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-field-hover)]"
                onClick={() => setIsCreating(false)}
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="justify-start px-2 h-10 text-[var(--text-secondary)] hover:bg-[var(--bg-field-hover)] hover:text-[var(--text-primary)] group mt-2"
            onClick={() => setIsCreating(true)}
          >
            <IconPlus className="mr-3 h-4 w-4" />
            Create Space
          </Button>
        )}
      </div>
    </div>
  );
}
