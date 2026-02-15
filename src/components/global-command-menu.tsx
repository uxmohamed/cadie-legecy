"use client";

import * as React from "react";
import { IconSearch, IconPlus, IconTrash, IconLayoutGrid, IconLayoutList, IconHelp, IconArrowsSort, IconFolder } from "@tabler/icons-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import type { Space } from "@/types";

interface GlobalCommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTrashView: boolean;
  viewMode: "list" | "grid";
  spaces?: Space[];
  selectedCategoryId: string | null;
  onFocusSearch: () => void;
  onOpenAddMode: () => void;
  onViewChange: (view: string | null) => void;
  onViewModeChange: (mode: "list" | "grid") => void;
  onSortChange: (sortBy: "date" | "title") => void;
  onToggleHelp: () => void;
}

export function GlobalCommandMenu({
  open,
  onOpenChange,
  isTrashView,
  viewMode,
  spaces,
  selectedCategoryId,
  onFocusSearch,
  onOpenAddMode,
  onViewChange,
  onViewModeChange,
  onSortChange,
  onToggleHelp,
}: GlobalCommandMenuProps) {
  const runCommand = React.useCallback(
    (action: () => void) => {
      action();
      onOpenChange(false);
    },
    [onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search commands and actions..." />
      <CommandList>
        <CommandEmpty>No matching command found.</CommandEmpty>

        <CommandGroup heading="General">
          <CommandItem onSelect={() => runCommand(onFocusSearch)}>
            <IconSearch className="mr-2 h-4 w-4" />
            Search links
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
          {!isTrashView && (
            <CommandItem onSelect={() => runCommand(onOpenAddMode)}>
              <IconPlus className="mr-2 h-4 w-4" />
              Add new link
              <CommandShortcut>N</CommandShortcut>
            </CommandItem>
          )}
          <CommandItem onSelect={() => runCommand(() => onViewModeChange(viewMode === "list" ? "grid" : "list"))}>
            {viewMode === "list" ? (
              <IconLayoutGrid className="mr-2 h-4 w-4" />
            ) : (
              <IconLayoutList className="mr-2 h-4 w-4" />
            )}
            Toggle {viewMode === "list" ? "grid" : "list"} view
            <CommandShortcut>V</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(onToggleHelp)}>
            <IconHelp className="mr-2 h-4 w-4" />
            Show keyboard shortcuts
            <CommandShortcut>⌘/</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Sort">
          <CommandItem onSelect={() => runCommand(() => onSortChange("date"))}>
            <IconArrowsSort className="mr-2 h-4 w-4" />
            Sort by date
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSortChange("title"))}>
            <IconArrowsSort className="mr-2 h-4 w-4" />
            Sort by name
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => runCommand(() => onViewChange(null))}>
            <IconFolder className="mr-2 h-4 w-4" />
            Go to All items
            {selectedCategoryId === null && <CommandShortcut>Current</CommandShortcut>}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onViewChange("trash"))}>
            <IconTrash className="mr-2 h-4 w-4" />
            Go to Trash
            {isTrashView && <CommandShortcut>Current</CommandShortcut>}
          </CommandItem>
          {spaces?.map((space) => (
            <CommandItem key={space.id} onSelect={() => runCommand(() => onViewChange(space.id))}>
              <IconFolder className="mr-2 h-4 w-4" />
              Go to {space.name}
              {selectedCategoryId === space.id && <CommandShortcut>Current</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
