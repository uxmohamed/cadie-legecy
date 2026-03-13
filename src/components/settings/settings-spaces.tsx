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
  IconCapsuleHorizontalFilled,
  IconLock,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { SPACE_COLORS, ColorPicker } from "@/components/spaces/color-picker";
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
  onUpdate: (id: string, updates: { name?: string; color?: string; description?: string | null }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  locked?: boolean;
}

function SpaceItem({ space, onUpdate, onDelete, locked }: SpaceItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(space.name);
  const [editDescription, setEditDescription] = React.useState(space.description || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setEditName(space.name);
    setEditDescription(space.description || "");
  }, [space.name, space.description]);

  const handleSaveSpace = async () => {
    const trimmedName = editName.trim();
    const trimmedDescription = editDescription.trim();
    if (!trimmedName) return;

    if (trimmedName !== space.name || trimmedDescription !== (space.description || "")) {
      await onUpdate(space.id, {
        name: trimmedName,
        description: trimmedDescription || null,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(space.name);
    setEditDescription(space.description || "");
    setIsEditing(false);
  };

  const handleColorChange = async (newColor: string) => {
    if (newColor !== space.color) {
      await onUpdate(space.id, { color: newColor });
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-start gap-3 py-2 px-2 rounded-md bg-bg-muted">
        <IconCapsuleHorizontalFilled
          className="h-4 w-4 shrink-0 mt-2"
          style={{ color: space.color }}
        />

        <div className="flex-1 space-y-2">
          <Input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveSpace();
              if (e.key === "Escape") handleCancel();
            }}
            className="h-8 bg-bg-input border-transparent shadow-none before:shadow-none focus:bg-bg focus:border-accent px-2"
            placeholder="Space name"
          />
          <Input
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") handleCancel();
            }}
            maxLength={240}
            className="h-8 text-xs bg-bg-input border-transparent shadow-none before:shadow-none focus:bg-bg focus:border-accent px-2"
            placeholder="Optional note for smarter AI routing"
          />
        </div>

        <div className="flex items-center gap-1 pt-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-fg-muted hover:text-fg hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-fg-muted"
            onClick={handleSaveSpace}
            disabled={editName.trim() === ""}
          >
            <IconCheck className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-fg-muted hover:text-fg hover:bg-bg-hover"
            onClick={handleCancel}
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-start gap-3 py-2 px-2 rounded-md transition-colors w-full max-w-full overflow-hidden ${locked ? "opacity-60" : "hover:bg-bg-hover"}`}>
      <Popover>
        <PopoverTrigger
          render={
            <button
              className="h-6 w-6 mt-0.5 flex items-center justify-center shrink-0 ring-2 ring-transparent hover:ring-border-hover transition-all cursor-pointer rounded-md"
              aria-label="Change color"
              disabled={locked}
            />
          }
        >
          <IconCapsuleHorizontalFilled
            className="h-4 w-4"
            style={{ color: space.color }}
          />
        </PopoverTrigger>
        {!locked && (
          <PopoverContent className="w-auto p-3" align="start">
            <ColorPicker
              selectedColor={space.color}
              onColorSelect={handleColorChange}
            />
          </PopoverContent>
        )}
      </Popover>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-fg font-medium overflow-hidden text-ellipsis whitespace-nowrap">{space.name}</p>
          {locked && (
            <Badge variant="secondary" size="sm" className="shrink-0 gap-1">
              <IconLock className="h-2.5 w-2.5" />
              Locked
            </Badge>
          )}
        </div>
        <p className="text-xs text-fg-muted overflow-hidden text-ellipsis whitespace-nowrap">
          {locked ? "Upgrade to unlock this space" : (space.description || "No note added")}
        </p>
      </div>

      {!locked && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-fg-subtle hover:text-fg hover:bg-bg-hover"
            onClick={() => setIsEditing(true)}
          >
            <IconPencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-fg-subtle hover:text-destructive hover:bg-destructive-muted"
                />
              }
            >
              <IconTrash className="h-3.5 w-3.5" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete space &quot;<span className="inline-block max-w-[200px] truncate align-bottom">{space.name}</span>&quot;?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All links in this space will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:opacity-90 border-transparent"
                  onClick={() => onDelete(space.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

export function SettingsSpaces() {
  const { spaces, createSpace, updateSpace, deleteSpace } = useSpaces(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newSpaceName, setNewSpaceName] = React.useState("");
  const [newSpaceColor, setNewSpaceColor] = React.useState(SPACE_COLORS.blue.cssVar);
  const createInputRef = React.useRef<HTMLInputElement>(null);
  const [lockedSpaceIds, setLockedSpaceIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    fetch("/api/billing/status")
      .then((res) => res.json())
      .then((data: { locked_space_ids?: string[] }) => {
        if (data.locked_space_ids && data.locked_space_ids.length > 0) {
          setLockedSpaceIds(new Set(data.locked_space_ids));
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (isCreating) {
      const colorKeys = Object.keys(SPACE_COLORS) as Array<keyof typeof SPACE_COLORS>;
      const randomColorKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
      setNewSpaceColor(SPACE_COLORS[randomColorKey].cssVar);
      setNewSpaceName("");
      setTimeout(() => createInputRef.current?.focus(), 0);
    }
  }, [isCreating]);

  const handleCreate = async () => {
    if (!newSpaceName.trim()) return;
    await createSpace(newSpaceName, newSpaceColor);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6 min-w-0 w-full overflow-hidden">
      <div className="flex flex-col gap-1 min-w-0 w-full overflow-hidden">
        {spaces.map((space) => (
          <SpaceItem
            key={space.id}
            space={space}
            onUpdate={updateSpace}
            onDelete={deleteSpace}
            locked={lockedSpaceIds.has(space.id)}
          />
        ))}

        {isCreating ? (
          <div className="flex items-center gap-3 py-2 px-2 rounded-md bg-bg-muted">
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    className="h-6 w-6 flex items-center justify-center shrink-0 ring-2 ring-transparent hover:ring-border-hover transition-all cursor-pointer rounded-md"
                    aria-label="Select color"
                  />
                }
              >
                <IconCapsuleHorizontalFilled
                  className="h-4 w-4"
                  style={{ color: newSpaceColor }}
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <ColorPicker
                  selectedColor={newSpaceColor}
                  onColorSelect={setNewSpaceColor}
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
              className="flex-1 h-8 bg-bg-input border-transparent shadow-none before:shadow-none focus:bg-bg focus:border-accent px-2"
            />

            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-fg-muted hover:text-fg hover:bg-bg-hover"
                onClick={handleCreate}
              >
                <IconCheck className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-fg-muted hover:text-fg hover:bg-bg-hover"
                onClick={() => setIsCreating(false)}
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="justify-start px-2 h-10 text-fg-muted hover:bg-bg-hover hover:text-fg group mt-2"
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
