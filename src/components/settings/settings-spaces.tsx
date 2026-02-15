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
} from "@tabler/icons-react";
import { SPACE_COLORS, ColorPicker } from "@/components/spaces/color-picker";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Space } from "@/types";
import type {
  AutoForwardingCondition,
  AutoForwardingField,
  AutoForwardingJoinOperator,
  AutoForwardingOperator,
} from "@/features/spaces/types/auto-forwarding";

interface SpaceItemProps {
  space: Space;
  onUpdate: (id: string, updates: { name?: string; color?: string }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const FIELD_OPTIONS: Array<{ value: AutoForwardingField; label: string }> = [
  { value: "domain", label: "Domain" },
  { value: "url", label: "URL" },
  { value: "title", label: "Title" },
  { value: "description", label: "Description" },
  { value: "contentType", label: "Content type" },
];

const OPERATOR_OPTIONS: Array<{ value: AutoForwardingOperator; label: string }> = [
  { value: "contains", label: "contains" },
  { value: "equals", label: "equals" },
];

const JOIN_OPTIONS: Array<{ value: AutoForwardingJoinOperator; label: string }> = [
  { value: "OR", label: "OR" },
  { value: "AND", label: "AND" },
];

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
      <div className="flex items-center gap-3 py-2 px-2 rounded-md bg-bg-muted">
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
          className="flex-1 h-8 bg-bg-input border-transparent shadow-none before:shadow-none focus:bg-bg focus:border-accent px-2"
        />

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-fg-muted hover:text-fg hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-fg-muted"
            onClick={handleSaveName}
            disabled={editName.trim() === space.name || !editName.trim()}
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
    <div className="group flex items-center gap-3 py-2 px-2 rounded-md hover:bg-bg-hover transition-colors w-full max-w-full overflow-hidden">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="h-6 w-6 flex items-center justify-center shrink-0 ring-2 ring-transparent hover:ring-border-hover transition-all cursor-pointer rounded-md"
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
          />
        </PopoverContent>
      </Popover>
      <span className="flex-1 w-0 text-sm text-fg font-medium overflow-hidden text-ellipsis whitespace-nowrap">
        {space.name}
      </span>

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
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-fg-subtle hover:text-destructive hover:bg-destructive-muted"
            >
              <IconTrash className="h-3.5 w-3.5" />
            </Button>
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
    </div>
  );
}

export function SettingsSpaces() {
  const { spaces, createSpace, updateSpace, deleteSpace } = useSpaces(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newSpaceName, setNewSpaceName] = React.useState("");
  const [newSpaceColor, setNewSpaceColor] = React.useState(SPACE_COLORS.blue.cssVar);
  const createInputRef = React.useRef<HTMLInputElement>(null);
  const [autoForwardingEnabled, setAutoForwardingEnabled] = React.useState(true);
  const [conditions, setConditions] = React.useState<AutoForwardingCondition[]>([]);
  const [isLoadingAutoForwarding, setIsLoadingAutoForwarding] = React.useState(true);
  const [isSavingAutoForwarding, setIsSavingAutoForwarding] = React.useState(false);

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

  const saveAutoForwardingSettings = React.useCallback(
    async (nextEnabled: boolean, nextConditions: AutoForwardingCondition[]) => {
      setIsSavingAutoForwarding(true);
      try {
        const response = await fetch("/api/settings/space-forwarding", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ enabled: nextEnabled, conditions: nextConditions }),
        });

        if (!response.ok) {
          throw new Error("Failed to update auto-forwarding settings");
        }

        const data = (await response.json()) as { enabled: boolean; conditions: AutoForwardingCondition[] };
        setAutoForwardingEnabled(data.enabled);
        setConditions(data.conditions || []);

        return true;
      } catch {
        return false;
      } finally {
        setIsSavingAutoForwarding(false);
      }
    },
    []
  );

  React.useEffect(() => {
    let mounted = true;

    const loadAutoForwardingPreference = async () => {
      try {
        const response = await fetch("/api/settings/space-forwarding");
        if (!response.ok) {
          throw new Error("Failed to load auto-forwarding settings");
        }

        const data = (await response.json()) as { enabled: boolean; conditions?: AutoForwardingCondition[] };
        if (mounted) {
          setAutoForwardingEnabled(data.enabled);
          setConditions(data.conditions || []);
        }
      } catch {
        if (mounted) {
          toast.error("Failed to load auto-forwarding setting");
        }
      } finally {
        if (mounted) {
          setIsLoadingAutoForwarding(false);
        }
      }
    };

    loadAutoForwardingPreference();

    return () => {
      mounted = false;
    };
  }, []);

  const handleAutoForwardingToggle = async (enabled: boolean) => {
    const previousEnabled = autoForwardingEnabled;
    setAutoForwardingEnabled(enabled);

    const success = await saveAutoForwardingSettings(enabled, conditions);
    if (success) {
      toast.success(enabled ? "Auto-forwarding enabled" : "Auto-forwarding disabled");
      return;
    }

    setAutoForwardingEnabled(previousEnabled);
    toast.error("Failed to update auto-forwarding setting");
  };

  const updateCondition = (id: string, updates: Partial<AutoForwardingCondition>) => {
    setConditions((prev) => prev.map((condition) => (condition.id === id ? { ...condition, ...updates } : condition)));
  };

  const persistConditions = async (nextConditions: AutoForwardingCondition[]) => {
    const previous = conditions;
    setConditions(nextConditions);
    const success = await saveAutoForwardingSettings(autoForwardingEnabled, nextConditions);
    if (!success) {
      setConditions(previous);
      toast.error("Failed to save advanced forwarding rules");
    }
  };

  const handleAddCondition = async () => {
    if (!spaces[1]) {
      toast.error("Create at least one custom space first");
      return;
    }

    const next: AutoForwardingCondition = {
      id: crypto.randomUUID(),
      targetSpaceId: spaces[1].id,
      field: "domain",
      operator: "contains",
      value: "instagram.com",
      join: "OR",
    };

    await persistConditions([...conditions, next]);
  };

  const handleSaveConditionField = async (
    id: string,
    updates: Partial<AutoForwardingCondition>,
    allowEmpty = false
  ) => {
    const next = conditions.map((condition) => (condition.id === id ? { ...condition, ...updates } : condition));

    if (!allowEmpty) {
      const edited = next.find((condition) => condition.id === id);
      if (edited && !edited.value.trim()) {
        toast.error("Condition value cannot be empty");
        return;
      }
    }

    await persistConditions(next);
  };

  const handleDeleteCondition = async (id: string) => {
    await persistConditions(conditions.filter((condition) => condition.id !== id));
  };

  return (
    <div className="flex flex-col gap-2 min-w-0 w-full overflow-hidden">
      <div className="flex flex-col gap-1 min-w-0 w-full overflow-hidden">
        <div className="rounded-md border border-border p-3 mb-2 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-fg">Smart auto-forwarding</p>
              <p className="text-xs text-fg-muted">Automatically adds new items to the best matching space.</p>
            </div>
            <Switch
              checked={autoForwardingEnabled}
              onCheckedChange={handleAutoForwardingToggle}
              disabled={isLoadingAutoForwarding || isSavingAutoForwarding}
              aria-label="Toggle smart auto-forwarding"
            />
          </div>

          {autoForwardingEnabled && (
            <div className="rounded-md border border-border/70 bg-bg-subtle/40 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-fg">Advanced routing rules</p>
                  <p className="text-xs text-fg-muted">
                    Add optional IF / OR / AND conditions. These rules run before AI matching.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddCondition}
                  disabled={isLoadingAutoForwarding || isSavingAutoForwarding}
                >
                  <IconPlus className="mr-1 h-3.5 w-3.5" />
                  Add condition
                </Button>
              </div>

              {conditions.length > 0 ? (
                <div className="space-y-2">
                  {conditions.map((condition, index) => (
                    <div key={condition.id} className="flex flex-col gap-2 rounded-md border border-border/60 bg-bg p-2">
                      <div className="flex items-center gap-2 text-xs text-fg-muted">
                        {index === 0 ? <span className="font-medium text-fg">IF</span> : (
                          <Select
                            value={condition.join}
                            onValueChange={(value) => handleSaveConditionField(condition.id, { join: value as AutoForwardingJoinOperator })}
                            disabled={isSavingAutoForwarding}
                          >
                            <SelectTrigger className="h-7 w-[84px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {JOIN_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <span>send to</span>
                        <Select
                          value={condition.targetSpaceId}
                          onValueChange={(value) => handleSaveConditionField(condition.id, { targetSpaceId: value })}
                          disabled={isSavingAutoForwarding}
                        >
                          <SelectTrigger className="h-7 w-[160px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {spaces.slice(1).map((space) => (
                              <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={condition.field}
                          onValueChange={(value) => handleSaveConditionField(condition.id, { field: value as AutoForwardingField })}
                          disabled={isSavingAutoForwarding}
                        >
                          <SelectTrigger className="h-8 w-[140px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={condition.operator}
                          onValueChange={(value) => handleSaveConditionField(condition.id, { operator: value as AutoForwardingOperator })}
                          disabled={isSavingAutoForwarding}
                        >
                          <SelectTrigger className="h-8 w-[120px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATOR_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          value={condition.value}
                          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                          onBlur={() => handleSaveConditionField(condition.id, {}, false)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          placeholder="instagram.com"
                          className="h-8 text-xs"
                          disabled={isSavingAutoForwarding}
                        />

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-fg-muted hover:text-destructive"
                          onClick={() => handleDeleteCondition(condition.id)}
                          disabled={isSavingAutoForwarding}
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-fg-muted">No advanced conditions yet. Add one for sources like Instagram, YouTube, or custom domains.</p>
              )}
            </div>
          )}
        </div>

        {spaces.map((space) => (
          <SpaceItem
            key={space.id}
            space={space}
            onUpdate={updateSpace}
            onDelete={deleteSpace}
          />
        ))}

        {isCreating ? (
          <div className="flex items-center gap-3 py-2 px-2 rounded-md bg-bg-muted">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-6 w-6 flex items-center justify-center shrink-0 ring-2 ring-transparent hover:ring-border-hover transition-all cursor-pointer rounded-md"
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
